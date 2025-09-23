import React, { useState, useEffect } from "react";
import { FormData, Quote } from "./types";
import { STEPS } from "./constants.ts";
import LogoHeader from "@/components/LogoHeader";
import ProgressBar from "@/components/ProgressBar";
import Card from "@/components/Card";
import SplashScreen from "@/components/SplashScreen";
import Step1UserInfo from "@/components/Step1UserInfo";
import Step2ServiceType from "@/components/Step2ServiceType";
import Step3EquipmentDetails from "@/components/Step3EquipmentDetails";
import Step4Quote from "@/components/Step4Quote";
import Step5Scheduler from "@/components/Step5Scheduler";
import Step6Payment from "@/components/Step6Payment";
import Step7Confirmation from "@/components/Step7Confirmation";
import StepPaymentError from "@/components/StepPaymentError";
import Snowfall from "react-snowfall"; // 👈 agregado

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

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [quote, setQuote] = useState<Quote | null>(null);

  // Restaurar desde localStorage al cargar la app
  useEffect(() => {
    const cachedForm = localStorage.getItem("formData");
    const cachedQuote = localStorage.getItem("quote");
    if (cachedForm) setFormData(JSON.parse(cachedForm));
    if (cachedQuote) setQuote(JSON.parse(cachedQuote));
  }, []);

  // Guardar cambios en quote en localStorage
  useEffect(() => {
    if (quote) {
      localStorage.setItem("quote", JSON.stringify(quote));
    }
  }, [quote]);

  // Detectar resultado de Mercado Pago al volver desde la pasarela
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentStatus = url.searchParams.get("collection_status");
    const paymentId = url.searchParams.get("payment_id");
    if (paymentStatus === "approved" && paymentId) {
      setCurrentStep(7); // Confirmación
    } else if (paymentStatus === "rejected" && paymentId) {
      setCurrentStep(8); // Error de pago
    }
  }, []);

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const restart = () => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setQuote(null);
    localStorage.removeItem("formData");
    localStorage.removeItem("quote");
  };

  const updateFormData = (data: Partial<FormData>) => {
    const newForm = { ...formData, ...data };
    setFormData(newForm);
    localStorage.setItem("formData", JSON.stringify(newForm));
  };

  const handlePaymentSuccess = () => {
    setQuote((prev) => ({ ...prev!, paymentStatus: "confirmed" }));
    setCurrentStep(7);
  };

  const handlePaymentFailure = () => {
    setQuote((prev) => ({ ...prev!, paymentStatus: "rejected" }));
    setCurrentStep(8);
  };

  const handlePayOnSite = () => {
    setQuote((prev) => ({ ...prev!, paymentStatus: "onSite" }));
    setCurrentStep(7);
  };

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
            formData={formData}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            onPayOnSite={handlePayOnSite} // 👈 nuevo
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
          <StepPaymentError
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
  <div className="bg-slate-900 min-h-screen font-sans flex items-center justify-center p-4 relative">
    {/* 🌨️ Nieve global hasta paso 6 */}
    {!isFinalStep && currentStep <= 6 && (
      <Snowfall style={{ position: "absolute", width: "100%", height: "100%" }} />
    )}

    <main className="max-w-xl w-full relative z-10">
      <Card className={showSplash ? "bg-white/80 backdrop-blur" : ""}>
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : (
          <>
            {!isFinalStep && (
              <>
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

            {/* Footer "Powered by" hasta paso 6 */}
            {!isFinalStep && currentStep <= 6 && (
              <p className="mt-6 text-center text-xs text-slate-500">
                <a
                  href="mailto:valentin.alvarez@alvarezllc.net"
                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 transition-colors font-semibold tracking-wide underline underline-offset-4 decoration-sky-400 hover:decoration-sky-600"
                >
                  ⚡ Powered by ALVAREZ LLC 2025®
                </a>
              </p>
            )}
          </>
        )}
      </Card>
    </main>
  </div>
);

}

export default App;
