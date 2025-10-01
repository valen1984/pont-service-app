import React, { useState, useEffect } from "react";
import { FormData, Quote } from "./types";
import { STEPS } from "@/constants";
import LogoHeader from "@/components/LogoHeader";
import Card from "@/components/Card";
import SplashScreen from "@/components/SplashScreen";
import Step1UserInfo from "@/components/Step1UserInfo";
import Step2ServiceType from "@/components/Step2ServiceType";
import Step3EquipmentDetails from "@/components/Step3EquipmentDetails";
import Step4Quote from "@/components/Step4Quote";
import Step5Scheduler from "@/components/Step5Scheduler";
import Step6Payment from "@/components/Step6Payment";
import Step7Result from "@/components/Step7Result";
import Snowfall from "react-snowfall";
import { motion } from "framer-motion";



// 📋 Estado inicial del formulario
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
  const [wind, setWind] = useState(0);
  const [snowflakeImages, setSnowflakeImages] = useState<HTMLImageElement[]>([]);

  // ... 🔄 tus useEffects de viento, snowflakes, localStorage, splash se quedan igual

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const restart = () => {
    console.log("🔄 Restart app");
    setCurrentStep(1);
    setFormData(initialFormData);
    setQuote(null);
    localStorage.removeItem("formData");
    localStorage.removeItem("quote");

    if (window?.history?.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const updateFormData = (data: Partial<FormData>) => {
    const newForm = { ...formData, ...data };
    setFormData(newForm);
    localStorage.setItem("formData", JSON.stringify(newForm));
  };

  const handlePaymentSuccess = () => {
    setQuote((prev) => ({ ...prev!, paymentStatus: "approved" }));
    setCurrentStep(7);
  };

  const handlePaymentFailure = () => {
    setQuote((prev) => ({ ...prev!, paymentStatus: "rejected" }));
    setCurrentStep(7);
  };

  const handlePayOnSite = () => {
    setQuote((prev) => ({ ...prev!, paymentStatus: "cash_home" }));
    setCurrentStep(7);
  };

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("payment_id");
  const status = params.get("status");

  if (paymentId) {
    console.log("🔎 Pago detectado en redirect:", { paymentId, status });

    setShowSplash(false);   // ✅ Saltar splash
    setCurrentStep(7);      // ✅ Ir directo a Step7

    fetch("/api/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, quote, paymentId }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Respuesta confirm-payment redirect:", data);
        if (data.success) {
          const estado =
            typeof data.estado === "string" ? data.estado : data.estado?.code || "approved";
          setQuote((prev) => ({ ...prev!, paymentStatus: estado }));
        } else {
          setQuote((prev) => ({ ...prev!, paymentStatus: "rejected" }));
        }
      })
      .catch((err) => {
        console.error("❌ Error confirmando pago en redirect:", err);
        setQuote((prev) => ({ ...prev!, paymentStatus: "rejected" }));
      })
      .finally(() => {
        if (window?.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
  }
}, []);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("payment_id");
  const status = params.get("status");

  if (paymentId) {
    console.log("🔎 Pago detectado en redirect:", { paymentId, status });

    // ✅ Recuperar del localStorage
    const storedFormData = JSON.parse(localStorage.getItem("formData") || "null");
    const storedQuote = JSON.parse(localStorage.getItem("quote") || "null");

    if (storedFormData) setFormData(storedFormData);
    if (storedQuote) setQuote(storedQuote);

    setShowSplash(false);   // ✅ Saltar splash
    setCurrentStep(7);      // ✅ Ir directo a Step7

    fetch("/api/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData: storedFormData || formData,
        quote: storedQuote || quote,
        paymentId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Respuesta confirm-payment redirect:", data);
        if (data.success) {
          const estado =
            typeof data.estado === "string"
              ? data.estado
              : data.estado?.code || "approved";
          setQuote((prev) => ({ ...(storedQuote || prev)!, paymentStatus: estado }));
        } else {
          setQuote((prev) => ({ ...(storedQuote || prev)!, paymentStatus: "rejected" }));
        }
      })
      .catch((err) => {
        console.error("❌ Error confirmando pago en redirect:", err);
        setQuote((prev) => ({ ...(storedQuote || prev)!, paymentStatus: "rejected" }));
      })
      .finally(() => {
        if (window?.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
  }
}, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1UserInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
      case 2:
        return <Step2ServiceType formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step3EquipmentDetails formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <Step4Quote formData={formData} setQuote={setQuote} nextStep={nextStep} prevStep={prevStep} />;
      case 5:
        return <Step5Scheduler formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 6:
        return <Step6Payment quote={quote} formData={formData} onPaymentSuccess={handlePaymentSuccess} onPaymentFailure={handlePaymentFailure} onPayOnSite={handlePayOnSite} prevStep={prevStep} />;
      case 7:
        return <Step7Result formData={formData} quote={quote} restart={restart} />;
      default:
        return <Step1UserInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
    }
  };

  const isFinalStep = currentStep === 7;

  return (
    <div className="bg-gradient-to-b from-slate-700 to-slate-500 min-h-screen font-sans flex items-center justify-center p-4 relative">
      {!isFinalStep &&
        Array.isArray(STEPS) &&
        currentStep <= (STEPS?.length ?? 0) &&
        snowflakeImages.length > 0 && (
          <Snowfall
            style={{ position: "absolute", width: "100%", height: "100%" }}
            snowflakeCount={160}
            radius={[2, 8]}
            speed={[0.5, 2]}
            images={snowflakeImages}
          />
        )}

      <main className="max-w-xl w-full relative z-10">
        <Card className={showSplash ? "bg-white/80 backdrop-blur" : ""}>
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            <>
              <LogoHeader />
              <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
                {Array.isArray(STEPS) ? STEPS[currentStep - 1] ?? "" : ""}
              </h1>

              {renderStep()}

              {!isFinalStep &&
                Array.isArray(STEPS) &&
                currentStep <= (STEPS?.length ?? 0) && (
                  <p className="mt-6 text-center text-xs text-slate-500">
                    <a
                      href="mailto:valentin.alvarez@alvarezllc.net"
                      className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 transition-colors font-semibold tracking-wide underline underline-offset-4 decoration-sky-400 hover:decoration-sky-600"
                    >
                      ⚡ Powered by ALVAREZ LLC 2025® v1.09.30.251
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
