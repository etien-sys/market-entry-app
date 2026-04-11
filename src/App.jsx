import { useState, useEffect } from 'react';
import { fetchContacts } from './utils/csvParser';
import { filterByMarket } from './utils/marketFilter';
import { getRepFromUrl } from './config/reps';
import Background from './components/Background';
import StepIndicator from './components/StepIndicator';
import IntakeForm from './components/IntakeForm';
import MarketGuide from './components/MarketGuide';
import StakeholderMap from './components/StakeholderMap';
import WorkWithUs from './components/WorkWithUs';
import Chatbot from './components/Chatbot';
import Admin from './components/Admin';

const IS_ADMIN = new URLSearchParams(window.location.search).has('admin');
const rep = getRepFromUrl(); // null = show both advisors

export default function App() {
  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchContacts()
      .then(data => { setContacts(data); setLoading(false); })
      .catch(err => { console.error(err); setFetchError(err.message); setLoading(false); });
  }, []);

  // Admin mode — full database search, bypasses normal flow
  if (IS_ADMIN) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090f' }}>
        <Background />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Admin contacts={contacts} loading={loading} />
        </div>
      </div>
    );
  }

  useEffect(() => {
    const saved = localStorage.getItem('market-entry-intake');
    if (saved) { try { setIntake(JSON.parse(saved)); } catch (_) {} }
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  function handleIntakeComplete(data) { setIntake(data); setStep(2); }
  function restart() { localStorage.removeItem('market-entry-intake'); setIntake(null); setStep(1); }

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', position: 'relative' }}>
      <Background />
      <div style={{
        maxWidth: step === 3 ? '1040px' : '600px',
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative', zIndex: 1,
        transition: 'max-width 0.3s ease',
      }}>
        <StepIndicator currentStep={step} />

        {fetchError && (
          <div style={{
            margin: '12px 20px 0', padding: '10px 14px',
            background: '#1a0a0e', border: '1px solid #3d1a22',
            borderRadius: '8px', fontSize: '12px', color: '#f87171',
          }}>
            Could not load contacts: {fetchError}
          </div>
        )}

        <div style={{ paddingBottom: '80px' }}>
          {step === 1 && <IntakeForm onComplete={handleIntakeComplete} />}
          {step === 2 && intake && <MarketGuide intake={intake} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && intake && <StakeholderMap intake={intake} contacts={contacts} loading={loading} onNext={() => setStep(4)} onBack={() => setStep(2)} rep={rep} />}
          {step === 4 && intake && <WorkWithUs intake={intake} onBack={() => setStep(3)} onRestart={restart} rep={rep} />}
        </div>
      </div>
      {step > 1 && intake && (
        <Chatbot intake={intake} contacts={filterByMarket(contacts, intake.market)} rep={rep} />
      )}
    </div>
  );
}
