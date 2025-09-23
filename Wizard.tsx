import React, { useState, useEffect } from "react";
import { FormData, Quote } from "./types.ts";
import { STEPS } from "./constants.ts";
import { initMercadoPago } from "@mercadopago/sdk-react";

import LogoHeader from "@/components/LogoHeader";
import ProgressBar from "@/components/ProgressBar";
import Card from "@/components/Card";
import Step1UserInfo from "@/components/Step1UserInfo";
import Step2ServiceType from "@/components/Step2ServiceType";
import Step3EquipmentDetails from "@/components/Step3EquipmentDetails";
import Step4Quote from "@/components/Step4Quote";
import Step5Scheduler from "@/components/Step5Scheduler";
import Step6Payment from "@/components/Step6Payment";

const initialFormData: FormData = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  location: "",
  serviceType: "",
  brand: "",
  model: "",
  photos: [],
  appointmentSlot: null,
};

interface Props {
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setQuote: React.Dispatch<React.SetStateAction<Quote | null>>;
}

const Wizard: React.FC<Props> = ({ setFormData, setQuote }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [localFormData, setLocalFormData] = useState<FormData>(initialFormData);
  const [quote, setLocalQuote] = useState<Quote | null>(null);

  // ✅ Inicializar Mercado Pago una sola vez
  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey, { locale: "es-AR" });
    } else {
      console.error("⚠️ Mercado Pago PUBLIC KEY no definida en .env");
    }
  }, []);

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const updateFormData = (data: Partial<FormData>) => {
    setLocalFormData((prev) => {
      const updated = { ...prev, ...data };
      setFormData(updated); // 👈 sincroniza con App
      return updated;
    });
  };

  // ✅ Handlers de pago
  const handlePaymentSuccess = () => {
    setLocalQuote((prev) => (prev ? { ...prev, paymentStatus: "confirmed" } : prev));
    setQuote((prev) => (prev ? { ...prev, paymentStatus: "confirmed" } : prev));
    nextStep(); // avanza al Step7
  };

  const handlePaymentFailure = () => {
    setLocalQuote((prev) => (prev ? { ...prev, paymentStatus: "rejected" } : prev));
    setQuote((prev) => (prev ? { ...prev, paymentStatus: "rejected" } : prev));
    nextStep(); // avanza al Step8 o error
  };

  const handlePayOnSite = () => {
    setLocalQuote((prev) => (prev ? { ...prev, paymentStatus: "onSite" } : prev));
    setQuote((prev) => (prev ? { ...prev, paymentStatus: "onSite" } : prev));
    nextStep(); // avanza al Step7
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1UserInfo
            formData={localFormData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <Step2ServiceType
            formData={localFormData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <Step3EquipmentDetails
            formData={localFormData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <Step4Quote
            formData={localFormData}
            setQuote={(q) => {
              setLocalQuote(q);
              setQuote(q); // sincroniza con App
            }}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <Step5Scheduler
            formData={localFormData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 6:
        return (
          <Step6Payment
            quote={quote}
            formData={localFormData}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            onPayOnSite={handlePayOnSite}
            prevStep={prevStep}
          />
        );
      default:
        return (
          <Step1UserInfo
            formData={localFormData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
    }
  };

  return (
    <Card>
      <LogoHeader />
      <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
        {STEPS[currentStep - 1]}
      </h1>
      <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />
      {renderStep()}
    </Card>
  );
};

export default Wizard;
