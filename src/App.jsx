import { useState, useEffect } from 'react';
import { fetchContacts } from './utils/csvParser';
import StepIndicator from './components/StepIndicator';
import IntakeForm from './components/IntakeForm';
import MarketGuide from './components/MarketGuide';
import StakeholderMap from './components/StakeholderMap';
import WorkWithUs from './components/WorkWithUs';

function App() {
  const [step, setStep] = useState(1);
  const [intake, setIntake] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts()
      .then((data) => {
        console.log('[Market Entry] Parsed contacts:', data);
        setContacts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Market Entry] Failed to load contacts:', err);
        setFetchError(err.message);
        setLoading(false);
      });
  }, []);

  // Restore intake from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('market-entry-intake');
    if (saved) {
      try {
        setIntake(JSON.parse(saved));
      } catch (_) {
        // ignore
      }
    }
  }, []);

  function handleIntakeComplete(data) {
    setIntake(data);
    setStep(2);
  }

  function restart() {
    localStorage.removeItem('market-entry-intake');
    setIntake(null);
    setStep(1);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9f9f9',
    }}>
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        background: '#f9f9f9',
        minHeight: '100vh',
      }}>
        <StepIndicator currentStep={step} />

        {fetchError && (
          <div style={{
            margin: '16px 20px 0',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#dc2626',
          }}>
            Could not load contact data: {fetchError}. Showing form only.
          </div>
        )}

        {step === 1 && (
          <IntakeForm onComplete={handleIntakeComplete} initialValues={intake} />
        )}

        {step === 2 && intake && (
          <MarketGuide
            intake={intake}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && intake && (
          <StakeholderMap
            intake={intake}
            contacts={contacts}
            loading={loading}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && intake && (
          <WorkWithUs
            intake={intake}
            onBack={() => setStep(3)}
            onRestart={restart}
          />
        )}
      </div>
    </div>
  );
}

export default App;
