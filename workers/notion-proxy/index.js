// Cloudflare Worker: SETI → Notion Sales Leads proxy
// Accepts CORS POST from the browser, writes a page to the Notion DB.
// Secrets (set via `wrangler secret put`):
//   NOTION_API_KEY  — the Notion integration token
//   NOTION_DB_ID    — the Sales Leads database ID

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Map app market codes → Notion " Market" select options
const MARKET_MAP = {
  UAE:  null,             // no UAE option in Notion yet
  CEE:  'CEE',
  DACH: null,             // individual countries only; left blank
  US:   'United States',
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, companyName, market, stage, goal, companyIntro, submittedAt } = body;

    // Build AI summary from all form fields
    const summary = [
      goal        && `Goal: ${goal}`,
      companyIntro && `About: ${companyIntro}`,
      stage       && `Company stage: ${stage}`,
      market      && `Target market: ${market}`,
      submittedAt && `Submitted: ${new Date(submittedAt).toLocaleString('en-GB', { timeZone: 'Europe/Sofia' })}`,
    ].filter(Boolean).join('\n\n');

    const properties = {
      // Required title
      'Company name': {
        title: [{ text: { content: companyName || name || email || 'SETI App Lead' } }],
      },
      // User-provided fields
      'Contact': { rich_text: [{ text: { content: name || '' } }] },
      'Email':   { rich_text: [{ text: { content: email || '' } }] },
      // Full context
      'AI summary': { rich_text: [{ text: { content: summary.slice(0, 2000) } }] },
      // Pipeline defaults
      'Stage':       { status: { name: 'New' } },
      'Lead source': { select: { name: 'Website / Registration form' } },
      'Lead type':   { select: { name: 'New lead' } },
    };

    // Market — only set if there's a matching Notion option
    const notionMarket = MARKET_MAP[market];
    if (notionMarket) {
      properties[' Market'] = { select: { name: notionMarket } };
    }

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_DB_ID },
        properties,
      }),
    });

    if (!notionRes.ok) {
      const err = await notionRes.text();
      console.error('Notion error:', err);
      return new Response(JSON.stringify({ error: err }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  },
};
