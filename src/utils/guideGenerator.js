const MARKET_CONTEXT = {
  UAE: {
    setupDetail: 'DIFC and ADGM are the default for B2B and tech — 100% foreign ownership, common law jurisdiction, strong investor trust. Mainland is better if you need UAE government contracts or physical retail presence.',
    eventsDetail: 'GITEX (Oct), FinTech Abu Dhabi (Nov), ADIPEC (Nov), and Seamless Middle East (May) are the highest-signal events. Each attracts the buyers and investors you\'re likely targeting.',
    timingDetail: 'Avoid Ramadan for first meetings. The two strongest deal windows are Sep–Nov and Feb–Mar. Summer (Jun–Aug) slows down significantly.',
    outreachDetail: 'Cold outreach converts poorly in the UAE. Decision-makers respond to warm intros from people in their trust network — budget one warm intro to open every account you want.',
  },
  CEE: {
    setupDetail: 'CEE is not one market. Bulgaria, Romania, and Greece each have distinct regulatory environments. Pick one anchor city first — Sofia and Bucharest have the most active startup ecosystems — then expand.',
    eventsDetail: 'How2Web (Sofia), Techsylvania (Cluj), and Athens Startup Week are the best founder-to-founder and founder-to-investor events. For enterprise buyers, vertical trade shows in each country differ.',
    timingDetail: 'Business culture is more direct than the Gulf. Meetings convert faster, but procurement cycles in enterprise are still 3–6 months. Q2 and Q3 are the most active deal periods.',
    outreachDetail: 'LinkedIn outreach works better in CEE than in the Gulf. Local accelerators and co-working spaces (Betahaus Sofia, Impact Hub Bucharest) are high-leverage for warm introductions.',
  },
  DACH: {
    setupDetail: 'Germany is the anchor market in DACH — a GmbH gives full credibility with enterprise buyers. Austria and Switzerland move faster and have less bureaucracy. A common approach: pilot in Austria or Switzerland, then use that reference to enter Germany.',
    eventsDetail: 'NOAH Conference (Berlin), OMR Festival (Hamburg, May), and DLD Munich are the highest-signal events for tech and investor access. Web Summit (Lisbon, Nov) also draws heavy DACH attendance.',
    timingDetail: 'German procurement cycles run 3–6 months and are process-heavy — budget accordingly. August is nearly dead. Q1 and Q4 are the strongest windows for new business conversations. Swiss and Austrian buyers move faster.',
    outreachDetail: 'DACH buyers value precision and credibility over personality. Case studies from recognisable logos open doors more than any pitch deck. Localised materials in German signal commitment and convert better for mid-market accounts.',
  },
  US: {
    setupDetail: 'Delaware C-Corp is the default for fundraising and US enterprise sales. If you\'re not raising from US VCs, an LLC may be sufficient. Set up a US phone number and address early — it signals you\'re serious about the market.',
    eventsDetail: 'TechCrunch Disrupt, Collision, and SaaStr Annual are high-leverage events for B2B SaaS. Vertical conferences outperform general tech events for enterprise pipeline — identify the 2–3 events your ICP actually attends.',
    timingDetail: 'US buyers move fast but churn high. Q1 is budget season — get in front of buyers in November–December when budgets are being set. August is slow; September resets everything. Expect compressed sales cycles vs. Europe.',
    outreachDetail: 'Cold outreach works in the US — but only if it\'s hyper-personalised. A short, direct email referencing a specific pain beats a polished deck. Warm intros from mutual connections still convert 5× better than cold.',
  },
  All: {
    setupDetail: 'Entering multiple markets simultaneously requires a sequenced approach. Choose one anchor market first based on where your ICP density is highest, then use those credentials to enter the next.',
    eventsDetail: 'Cross-market events like Web Summit (Lisbon, Nov) and Slush (Helsinki, Nov) attract buyers and investors from all your target markets — high leverage for a multi-market strategy.',
    timingDetail: 'Plan your calendar around the key deal windows in each market: UAE Q4, CEE Q2–Q3, DACH Q1/Q4, US year-round. Don\'t run parallel market sprints — sequence them.',
    outreachDetail: 'A warm intro in one market often unlocks the next. Ask every contact for a cross-market referral — "Who do you know in [next market]?" extends your network without starting from zero.',
  },
};

function detectIntent(goal) {
  const g = goal.toLowerCase();
  if (/investor|raise|funding|round|vc|capital|seed/.test(g)) return 'fundraising';
  if (/partner|partnership|channel|reseller|distributor|alliance/.test(g)) return 'partnerships';
  if (/media|press|brand|awareness|coverage|publish|journalist/.test(g)) return 'media';
  return 'sales'; // default
}

function detectSector(goal, intro) {
  const text = (goal + ' ' + intro).toLowerCase();
  if (/drone|uav|unmanned/.test(text)) return 'drone';
  if (/fintech|payment|banking|finance|lending/.test(text)) return 'fintech';
  if (/health|medtech|medical|clinical|patient/.test(text)) return 'healthtech';
  if (/ai|machine learning|llm|artificial intelligence/.test(text)) return 'AI';
  if (/logistics|supply chain|freight|shipping/.test(text)) return 'logistics';
  if (/saas|software|b2b software|platform/.test(text)) return 'SaaS';
  if (/climate|energy|sustainability|green|carbon/.test(text)) return 'climatetech';
  if (/prop.?tech|real estate|property/.test(text)) return 'proptech';
  return null;
}

function sectorNote(sector, market) {
  const notes = {
    drone: {
      UAE: 'Drone operators need GCAA certification before commercial flights. Build this into your setup timeline — it takes 4–8 weeks.',
      CEE: 'EASA regulations apply across most CEE markets. Romania and Bulgaria both have active drone use-cases in agriculture and border monitoring.',
      DACH: 'LBA (Germany) regulates drone operations. Agriculture, infrastructure inspection, and logistics are the strongest commercial use-cases in DACH.',
      US: 'FAA Part 107 certification is required for commercial operations. Enterprise drone demand is strongest in agriculture, construction, and public safety.',
    },
    fintech: {
      UAE: 'DIFC and ADGM each have regulatory sandbox programs — apply early, it signals commitment to local regulators and opens doors to licensed banks.',
      CEE: 'PSD2 compliance is table stakes across EU CEE markets. BNR (Romania), BNB (Bulgaria), and Bank of Greece are your primary regulatory relationships.',
      DACH: 'BaFin (Germany) and FINMA (Switzerland) are your primary regulators. Germany\'s open banking ecosystem and Switzerland\'s crypto-friendly regulations create distinct entry paths.',
      US: 'State-by-state money transmitter licensing is complex — start with a limited geography or use a Banking-as-a-Service partner to move faster.',
    },
    AI: {
      UAE: 'UAE has a national AI strategy and a dedicated AI minister. Frame your pitch around the national agenda — it accelerates government procurement.',
      CEE: 'EU AI Act compliance is now a requirement for enterprise sales. Frame it as a feature, not a constraint — buyers are asking for it.',
      DACH: 'German enterprise buyers are cautious on AI — data privacy (GDPR), explainability, and on-premise deployment options are the top three buying criteria.',
      US: 'US enterprise AI adoption is fastest globally. Focus on ROI metrics and integration with existing stacks (Salesforce, ServiceNow, Workday) over raw capability.',
    },
  };
  return notes[sector]?.[market] || null;
}

function buildSteps(intake) {
  const { market, goal, stage, companyIntro = '' } = intake;
  const ctx = MARKET_CONTEXT[market] || MARKET_CONTEXT['All'];
  const intent = detectIntent(goal);
  const sector = detectSector(goal, companyIntro);
  const marketLabel = market === 'All' ? 'your target markets' : market;

  const steps = [];

  // Step 1: Legal/Setup
  steps.push({
    icon: '🏢',
    heading: `Set up your ${marketLabel} presence`,
    body: ctx.setupDetail + (sector ? '' : ' Most B2B companies start lean — a representative office or free zone entity before committing to full incorporation.'),
  });

  // Step 2: Sector-specific regulatory note (if sector detected) OR beachhead targeting
  if (sector && sectorNote(sector, market)) {
    steps.push({
      icon: '📋',
      heading: `${sector.charAt(0).toUpperCase() + sector.slice(1)} specifics for ${marketLabel}`,
      body: sectorNote(sector, market),
    });
  } else {
    const beachheadByIntent = {
      fundraising: `Map the investor landscape before outreach. In ${marketLabel}, the most relevant profiles are family offices (check tickets $500K–$5M), regional VCs with portfolio fit, and sovereign-backed programs. ${stage === 'Idea' || stage === 'Early' ? 'At your stage, target investors who have written pre-seed or seed checks locally in the last 18 months.' : 'At your stage, target investors who have backed growth rounds in your sector.'}`,
      partnerships: `Define exactly what you need from a partner before mapping them — distribution, co-sell, integration, or local credibility. In ${marketLabel}, the most valuable partnerships are often with established local operators who already have the relationships you\'re building.`,
      media: `Map the media landscape before pitching. In ${marketLabel}, a handful of publications drive most of the industry readership. Getting one strong placement in the right outlet is worth more than five in general tech press.`,
      sales: `Narrow your ICP before outreach. In ${marketLabel}, the same product often sells to a different buyer persona than in your home market. Run 10 discovery calls before setting up an entity — validate the problem and the champion profile first.`,
    };
    steps.push({
      icon: '🎯',
      heading: 'Define your beachhead',
      body: beachheadByIntent[intent],
    });
  }

  // Step 3: Events & community
  steps.push({
    icon: '📅',
    heading: `Key events and communities in ${marketLabel}`,
    body: ctx.eventsDetail + ' Attend first as a visitor to map the room before committing to sponsorship or a speaking slot.',
  });

  // Step 4: Warm intro strategy
  steps.push({
    icon: '🤝',
    heading: 'Build your intro pipeline',
    body: ctx.outreachDetail + (stage === 'Idea' || stage === 'Early'
      ? ' At your stage, aim for 8–12 quality warm introductions over 90 days — depth over breadth.'
      : ' At your stage, systematise this: track intro requests, conversion to meetings, and meeting-to-pipeline rate.'),
  });

  // Step 5: First milestone
  const milestones = {
    Idea: `Your 90-day milestone: complete 10 customer discovery interviews and validate that the problem you\'re solving is acute enough to pay for. Don\'t pitch — just listen and map the buyer\'s world.`,
    Early: `Your 90-day milestone: land one paying customer or a signed pilot agreement with a named account. One reference customer in ${marketLabel} is worth more than any marketing spend at this stage.`,
    Growth: `Your 90-day milestone: close 3 new accounts and identify your top-performing channel in ${marketLabel}. Use those wins to build a reference story that opens the next 10 doors.`,
    Scale: `Your 90-day milestone: validate whether ${marketLabel} can become a self-sustaining revenue territory. Set a P&L target and hire or partner for local execution before your next board review.`,
  };
  steps.push({
    icon: '🏁',
    heading: 'Your first 90-day milestone',
    body: milestones[stage] || milestones['Early'],
  });

  return steps;
}

export { buildSteps };
