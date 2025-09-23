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
import Snowfall from "react-snowfall";
import { motion } from "framer-motion";

// 👇 Crear imágenes a partir de emojis
function createEmojiImage(emoji: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "28px serif";
  ctx.fillText(emoji, 0, 24);
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

const snowflakeImages = [
  createEmojiImage("❄️"),
  createEmojiImage("✦"),
  createEmojiImage("✧"),
];

// 🌬️ Viento polar
function ColdWind() {
  const layers = 3;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: layers }).map((_, i) => {
        const top = 10 + i * 28;
        const dur = 8 + i * 2;
        const delay = i * 2.5;
        const yDrift = i === 1 ? 8 : 5;

        return (
          <motion.div
            key={i}
            className="absolute left-0 w-full h-1/4
                       bg-gradient-to-r from-cyan-200/20 to-transparent
                       backdrop-blur-sm rounded-full"
            style={{ top: `${top}%` }}
            animate={{
              x: ["-120%", "100%"],
              y: [`-${yDrift}%`, `${yDrift}%`, `-${yDrift}%`],
              opacity: [0.06, 0.22, 0.06],
            }}
            transition={{
              duration: dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        );
      })}
    </div>
  );
}

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

  // 🎐 Viento oscilante para los copos
  useEffect(() => {
    let direction = 1;
    const interval = setInterval(() => {
      setWind((w) => {
        const next = w + 0.2 * direction;
        if (next > 1.5 || next < -1.5) direction *= -1;
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Restaurar desde localStorage
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

  // 🔁 Retorno desde Mercado Pago
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentId = url.searchParams.get("payment_id");
    const collectionStatus =
      url.searchParams.get("collection_status") || url.searchParams.get("status");

    const handleFallbackByCollectionStatus = (status: string) => {
      const s = status.toLowerCase();
      if (s === "approved") {
        setCurrentStep(7);
        setQuote((prev) => (prev ? { ...prev, paymentStatus: "confirmed" } : prev));
      } else if (s === "pending") {
        setCurrentStep(8);
        setQuote((prev) => (prev ? { ...prev, paymentStatus: "pending" } : prev));
      } else if (s === "rejected") {
        setCurrentStep(8);
        setQuote((prev) => (prev ? { ...prev, paymentStatus: "rejected" } : prev));
      }
    };

    const fetchStatus = async () => {
      try {
        if (paymentId) {
          const res = await fetch(`/api/payment-status/${paymentId}`);
          const data = await res.json();

          if (data?.quote) {
            setFormData(data.formData);
            setQuote(data.quote);

            if (data.status === "approved") {
              setCurrentStep(7);
            } else if (["rejected", "pending"].includes(data.status)) {
              setCurrentStep(8);
            }
          } else if (collectionStatus) {
            handleFallbackByCollectionStatus(collectionStatus);
          }
        } else if (collectionStatus) {
          handleFallbackByCollectionStatus(collectionStatus);
        }
      } catch (err) {
        console.error("❌ Error consultando estado de pago:", err);
        if (collectionStatus) handleFallbackByCollectionStatus(collectionStatus);
      }
    };

    if (paymentId || collectionStatus) fetchStatus();
  }, []);

  // ⏳ Timer de splash (6s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);

      // 🧹 limpiar querystring para evitar loop
      if (window?.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Garantizar arranque en Step 1
      if (!quote && currentStep === 1) {
        setCurrentStep(1);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const restart = () => {
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
            onPayOnSite={handlePayOnSite}
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
    <div className="bg-gradient-to-b from-slate-700 to-slate-500 min-h-screen font-sans flex items-center justify-center p-4 relative">
      {/* ❄️ Copos */}
      {!isFinalStep && currentStep <= 6 && (
        <Snowfall
          style={{ position: "absolute", width: "100%", height: "100%" }}
          snowflakeCount={160}
          radius={[2, 8]}
          speed={[0.5, 2]}
          wind={[wind - 0.5, wind + 0.5]}
          images={snowflakeImages}
        />
      )}

      {/* 🌬️ Ráfagas “polar” */}
      {!isFinalStep && currentStep <= 6 && <ColdWind />}

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
