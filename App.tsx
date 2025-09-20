import React, { useState, useEffect } from 'react';
import { FormData, Quote } from './types';
import { STEPS } from './constants';

// ✅ Import corregidos (sin ./src/)
import LogoHeader from '@/components/LogoHeader';
import ProgressBar from '@/components/ProgressBar';
import Card from '@/components/Card';
import Step1UserInfo from '@/components/Step1UserInfo';
import Step2ServiceType from '@/components/Step2ServiceType';
import Step3EquipmentDetails from '@/components/Step3EquipmentDetails';
import Step4Quote from '@/components/Step4Quote';
import Step5Scheduler from '@/components/Step5Scheduler';
import Step6Payment from '@/components/Step6Payment';
import Step7Confirmation from '@/components/Step7Confirmation';
import StepPaymentError from '.@/components/StepPaymentError';

const initialFormData: FormData = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  location: '',
  serviceType: '',
  brand: '',
  model: '',
  photos: [],
  appointmentSlot: null,
};

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [quote, setQuote] = useState<Quote | null>(null);

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const restart = () => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setQuote(null);
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handlePaymentSuccess = () => setCurrentStep(7);
  const handlePaymentFailure = () => setCurrentStep(8);

  // 🔹 Detectar resultado de Mercado Pago en la URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get('status');

    if (status === 'success') {
      setCurrentStep(7); // Confirmación
    } else if (status === 'failure') {
      setCurrentStep(8); // Error de pago
    }
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1UserInfo
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <Step2ServiceType
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <Step3EquipmentDetails
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <Step4Quote
            formData={formData}
            setQuote={setQuote}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <Step5Scheduler
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 6:
        return (
          <Step6Payment
            quote={quote}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            prevStep={prevStep}
          />
        );
      case 7:
        return (
          <Step7Confirmation
            formData={formData}
            quote={quote}
            restart={restart}
          />
        );
      case 8:
        return (
          <Step8PaymentError
            formData={formData}
            quote={quote}
            restart={restart}
          />
        );
      default:
        return (
          <Step1UserInfo
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
    }
  };

  const isFinalStep = currentStep === 7 || currentStep === 8;

  return (
    <div className="bg-slate-100 min-h-screen font-sans flex items-center justify-center p-4">
      <main className="max-w-xl w-full">
        <Card>
          {!isFinalStep && (
            <>
              {/* Logo dentro del formulario */}
              <LogoHeader />

              <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
                {STEPS[currentStep - 1]}
              </h1>
              <ProgressBar
                currentStep={currentStep}
                totalSteps={STEPS.length}
              />
            </>
          )}
          {renderStep()}
        </Card>
      </main>
    </div>
  );
}

export default App;
