const MARKET_INSIGHTS = {
  UAE: [
    {
      icon: '🏢',
      heading: 'Free zone vs mainland',
      body: 'Most foreign B2B companies set up in DIFC or ADGM — 100% foreign ownership, common law jurisdiction. Mainland requires a local sponsor but gives broader market access.',
    },
    {
      icon: '🤝',
      heading: 'Relationship-driven sales cycles',
      body: 'Sales cycles are relationship-driven. A warm intro from a trusted intermediary cuts a 6-month cycle in half — cold outreach rarely converts.',
    },
    {
      icon: '📅',
      heading: 'Timing your market entry',
      body: 'Avoid Ramadan for first meetings. Q4 (Oct–Dec) is the strongest season for deal-making in the UAE.',
    },
    {
      icon: '💡',
      heading: 'Government & enterprise buy cycles',
      body: 'Government entities and large enterprises operate on fiscal cycles — budget approvals in Q1 mean decisions land in Q3–Q4. Plan your pipeline accordingly.',
    },
  ],
  'Saudi Arabia': [
    {
      icon: '🏛️',
      heading: 'Vision 2030 context',
      body: 'Saudi Arabia is mid-transformation under Vision 2030. Most enterprise spending is tied to national programs — understand which pillar your product maps to.',
    },
    {
      icon: '🤝',
      heading: 'Local partnerships matter',
      body: 'A local partner (Saudi national or entity) is not just legal scaffolding — it signals commitment and opens government doors that remain closed to foreign-only players.',
    },
    {
      icon: '📅',
      heading: 'Seasonal rhythms',
      body: 'Ramadan significantly slows decision-making. The strongest deal windows are Feb–Mar and Sep–Nov. Summer heat also clears offices from June to August.',
    },
  ],
  CEE: [
    {
      icon: '🌍',
      heading: 'Diverse markets, one region',
      body: 'CEE is not monolithic — Bulgaria, Romania, Greece, and Croatia each have distinct regulatory environments and buyer cultures. Segment your entry strategy market by market.',
    },
    {
      icon: '💰',
      heading: 'Strong startup ecosystems',
      body: 'Sofia, Bucharest, and Zagreb are growing tech hubs with active VC communities and founder networks. Events and accelerators are the fastest paths to warm introductions.',
    },
    {
      icon: '🏦',
      heading: 'EU funding drives enterprise budgets',
      body: 'Many enterprise buyers access EU structural funds and Horizon grants — positioning your solution within these funding frameworks accelerates procurement.',
    },
  ],
  All: [
    {
      icon: '🌐',
      heading: 'Multi-market entry strategy',
      body: 'Expanding across multiple markets simultaneously requires a sequenced playbook. Identify your anchor market first, then leverage those credentials in adjacent markets.',
    },
    {
      icon: '🤝',
      heading: 'Network is your fastest path',
      body: 'In every market, the fastest deals come through trusted introductions. Building your advisor network before entering a market cuts average sales cycles significantly.',
    },
    {
      icon: '📋',
      heading: 'Localise your positioning',
      body: 'The same product needs different value framing per market. What resonates with a UAE enterprise buyer differs from a CEE investor or Saudi government entity.',
    },
  ],
};

function InsightCard({ icon, heading, body }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: '20px 20px 20px 16px',
      borderLeft: '3px solid #1a1a1a',
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>{heading}</p>
        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.55' }}>{body}</p>
      </div>
    </div>
  );
}

export default function MarketGuide({ intake, onNext, onBack }) {
  const insights = MARKET_INSIGHTS[intake.market] || MARKET_INSIGHTS['All'];

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          Market Guide
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px', marginBottom: '6px' }}>
          Entering {intake.market === 'All' ? 'multiple markets' : intake.market}
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          Key insights for your {intake.stage}-stage company.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {insights.map((insight, i) => (
          <InsightCard key={i} {...insight} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 20px',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: '12px 24px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
          }}
          onMouseOver={(e) => { e.target.style.opacity = '0.85'; }}
          onMouseOut={(e) => { e.target.style.opacity = '1'; }}
        >
          See your stakeholder map →
        </button>
      </div>
    </div>
  );
}
