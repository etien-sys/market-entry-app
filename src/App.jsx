import { useState, useEffect } from 'react';
import { fetchContacts } from './utils/csvParser';
import StepIndicator from './components/StepIndicator';
import IntakeForm from './components/IntakeForm';
import MarketGuide from './components/MarketGuide';
import StakeholderMap from './components/StakeholderMap';
import WorkWithUs from './components/WorkWithUs';

export default function App() {
  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchContacts()
      .then((data) => { console.log('[Market Entry] Contacts:', data); setContacts(data); setLoading(false); })
      .catch((err) => { console.error(err); setFetchError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('market-entry-intake');
    if (saved) { try { setIntake(JSON.parse(saved)); } catch (_) {} }
  }, []);

  // scroll to top on step change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  function handleIntakeComplete(data) { setIntake(data); setStep(2); }
  function restart() { localStorage.removeItem('market-entry-intake'); setIntake(null); setStep(1); }

  const isWide = step === 3;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3ef' }}>
      <div style={{
        maxWidth: isWide ? '1040px' : '600px',
        margin: '0 auto',
        minHeight: '100vh',
        transition: 'max-width 0.3s ease',
      }}>

        <StepIndicator currentStep={step} />

        {fetchError && (
          <div style={{
            margin: '12px 20px 0', padding: '10px 14px',
            background: '#fff1f2', border: '1px solid #fecdd3',
            borderRadius: '8px', fontSize: '12px', color: '#e11d48',
          }}>
            Could not load contact data: {fetchError}
          </div>
        )}

        <div style={{ padding: '0 0 80px' }}>
          {step === 1 && <IntakeForm onComplete={handleIntakeComplete} />}
          {step === 2 && intake && <MarketGuide intake={intake} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && intake && <StakeholderMap intake={intake} contacts={contacts} loading={loading} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && intake && <WorkWithUs intake={intake} onBack={() => setStep(3)} onRestart={restart} />}
        </div>
      </div>
    </div>
  );
}
