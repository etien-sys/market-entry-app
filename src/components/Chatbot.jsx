import { useState, useRef, useEffect } from 'react';

const PURPLE = '#7c6fe0';
const PURPLE_DIM = 'rgba(124,111,224,0.15)';
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(intake, contacts) {
  const { market, goal, stage, companyIntro } = intake;
  const contactLines = (contacts || [])
    .slice(0, 20)
    .map(c => `- ${c.name} (${c.role} at ${c.company}, ${c.basedIn || market}, ${c.orgType})`)
    .join('\n');

  return `You are SETI, an AI market-entry advisor helping a founder navigate expansion into ${market}.

ABOUT THE FOUNDER:
- Company: ${companyIntro || 'Not provided'}
- Market they are entering: ${market}
- Goal: ${goal}
- Company stage: ${stage}

RELEVANT CONTACTS IN THEIR NETWORK (visible to them on the platform):
${contactLines || 'No contacts loaded yet.'}

YOUR ROLE:
- Answer questions about which contacts to approach first and why
- Give practical next steps for entering ${market}
- Advise on outreach strategy, meeting preparation, and intro sequencing
- Draw on regional context (GCC business culture, UAE/Saudi dynamics, CEE market nuances)
- Be concise, specific, and founder-friendly

Do not make up contacts not listed above. If asked about contacts not on the list, say you can only speak to the ones visible in their map.`;
}

const STARTERS = [
  'Who should I approach first?',
  'How do I prepare for my first investor meeting here?',
  'What are my top 3 next steps?',
  'How do I get a warm intro from SETI?',
];

function ApiKeyPrompt({ onSave }) {
  const [val, setVal] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '13px', color: '#9b9bb5', lineHeight: '1.6', margin: 0 }}>
        SETI Chat uses Claude AI. Enter your Anthropic API key to continue — it's stored only in your browser.
      </p>
      <input
        ref={inputRef}
        type="password"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.startsWith('sk-')) onSave(val); }}
        placeholder="sk-ant-..."
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', background: '#0d0d16',
          border: `1.5px solid ${PURPLE}`, borderRadius: '8px',
          fontSize: '13px', color: '#e8e8f0', outline: 'none',
          fontFamily: 'monospace',
        }}
      />
      <button
        disabled={!val.startsWith('sk-')}
        onClick={() => onSave(val)}
        style={{
          padding: '10px', background: val.startsWith('sk-') ? PURPLE : '#1e1e2e',
          color: '#fff', border: 'none', borderRadius: '8px',
          fontSize: '13px', fontWeight: '600', cursor: val.startsWith('sk-') ? 'pointer' : 'default',
          transition: 'background 0.2s',
        }}
      >
        Save & Start Chatting
      </button>
      <p style={{ fontSize: '11px', color: '#3a3a52', margin: 0, lineHeight: '1.5' }}>
        Your key is never sent to SETI servers — only to Anthropic's API directly.
      </p>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 13px',
        background: isUser ? PURPLE_DIM : '#111119',
        border: `1px solid ${isUser ? 'rgba(124,111,224,0.35)' : '#1e1e2e'}`,
        borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
        fontSize: '13px', color: '#e8e8f0', lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
        {msg.streaming && (
          <span style={{ display: 'inline-block', width: '6px', height: '13px', background: PURPLE, marginLeft: '3px', borderRadius: '1px', animation: 'blink 0.9s step-end infinite' }} />
        )}
      </div>
    </div>
  );
}

export default function Chatbot({ intake, contacts }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('seti-claude-key') || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open && apiKey) inputRef.current?.focus();
  }, [open, apiKey]);

  function saveKey(key) {
    localStorage.setItem('seti-claude-key', key);
    setApiKey(key);
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    const assistantMsg = { role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: HAIKU_MODEL,
          max_tokens: 600,
          stream: true,
          system: buildSystemPrompt(intake, contacts),
          messages: nextHistory.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(err?.error?.message || `API error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: true };
                return updated;
              });
            }
          } catch (_) {}
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: false };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Sorry, something went wrong: ${err.message}`,
          streaming: false,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  const showKeyPrompt = open && !apiKey;
  const showChat = open && !!apiKey;

  return (
    <>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask SETI"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          width: '52px', height: '52px', borderRadius: '50%',
          background: open ? '#1e1e2e' : PURPLE,
          border: `2px solid ${PURPLE}`,
          boxShadow: `0 4px 20px rgba(124,111,224,0.4)`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', transition: 'all 0.2s',
          color: open ? PURPLE : '#fff',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '88px', right: '24px', zIndex: 999,
          width: '360px', maxWidth: 'calc(100vw - 32px)',
          background: '#111119',
          border: `1.5px solid #1e1e2e`,
          borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '520px',
          animation: 'fadeUp 0.2s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #1e1e2e',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: PURPLE_DIM, border: `1px solid ${PURPLE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px',
            }}>🌙</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#e8e8f0' }}>SETI Chat</div>
              <div style={{ fontSize: '11px', color: '#4a4a65' }}>Your market entry advisor</div>
            </div>
            {apiKey && (
              <button
                onClick={() => { setApiKey(''); localStorage.removeItem('seti-claude-key'); }}
                title="Change API key"
                style={{ marginLeft: 'auto', fontSize: '11px', color: '#3a3a52', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                key ✕
              </button>
            )}
          </div>

          {showKeyPrompt && <ApiKeyPrompt onSave={saveKey} />}

          {showChat && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {messages.length === 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', color: '#6b6b85', lineHeight: '1.6', marginBottom: '14px' }}>
                      Ask me anything about your {intake.market} market entry — contacts, next steps, strategy.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {STARTERS.map(s => (
                        <button key={s} onClick={() => sendMessage(s)}
                          style={{
                            textAlign: 'left', padding: '8px 12px',
                            background: '#0d0d16', border: '1px solid #1e1e2e',
                            borderRadius: '8px', fontSize: '12px', color: '#9b9bb5',
                            cursor: 'pointer', transition: 'border-color 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.color = '#c4befc'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.color = '#9b9bb5'; }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 14px', borderTop: '1px solid #1e1e2e',
                display: 'flex', gap: '8px', alignItems: 'flex-end',
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                  }}
                  placeholder="Ask about your next steps…"
                  rows={1}
                  style={{
                    flex: 1, padding: '9px 11px',
                    background: '#0d0d16', border: '1.5px solid #1e1e2e',
                    borderRadius: '8px', fontSize: '13px', color: '#e8e8f0',
                    outline: 'none', resize: 'none', fontFamily: 'inherit',
                    lineHeight: '1.5', maxHeight: '80px', overflowY: 'auto',
                  }}
                  onFocus={e => { e.target.style.borderColor = PURPLE; }}
                  onBlur={e => { e.target.style.borderColor = '#1e1e2e'; }}
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  style={{
                    padding: '9px 14px', background: loading || !input.trim() ? '#1e1e2e' : PURPLE,
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '600',
                    cursor: loading || !input.trim() ? 'default' : 'pointer',
                    transition: 'background 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? '…' : '→'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
