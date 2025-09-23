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
import Step7Confirmation from "@/components/Step7Confirmation";
import StepPaymentError from "@/components/StepPaymentError";
import Snowfall from "react-snowfall";
import { motion } from "framer-motion";

// 👇 Crear imágenes a partir de emojis
function createEmojiImage(emoji: string): HTMLImageElement {
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

// ❄️ Copos de nieve personalizados
const snowflakeImages: HTMLImageElement[] = [
  createEmojiImage("❄️"),
  createEmojiImage("✦"),
  createEmojiImage("✧"),
];

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

// 🔎 Debug inicial
console.log("🔎 STEPS en runtime:", STEPS);

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [wind, setWind] = useState(0);

  // 🎐 Viento oscilante
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

  // Guardar cambios en quote
  useEffect(() => {
    if (quote) {
      localStorage.setItem("quote", JSON.stringify(quote));
    }
  }, [quote]);

  // ✅ Guardia de rango
  useEffect(() => {
    if (currentStep < 1) {
      setCurrentStep(1);
    } else if (Array.isArray(STEPS) && currentStep > STEPS.length) {
      setCurrentStep(STEPS.length);
    }
  }, [currentStep]);

  // 🔁 Retorno desde Mercado Pago
  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentId = url.searchParams.get("payment_id");
    const collectionStatus =
      url.searchParams.get("collection_status") || url.searchParams.get("status");

    if (paymentId && collectionStatus) {
      console.log("🔎 Retorno de MP detectado:", { paymentId, collectionStatus });

      fetch(`/api/payment-status/${paymentId}`)
        .then((res) => res.json())
        .then(async (data) => {
          console.log("📩 Respuesta de /api/payment-status:", data);

          if (data?.quote) {
            setFormData(data.formData);
            setQuote(data.quote);

            if (data.status === "approved") {
              try {
                const confirmRes = await fetch("/api/confirm-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paymentId,
                    formData: data.formData,
                    quote: { ...data.quote, paymentStatus: "confirmed" },
                  }),
                });
                console.log("📤 Respuesta /api/confirm-payment:", await confirmRes.json());
              } catch (err) {
                console.error("❌ Error confirmando pago:", err);
              }

              setCurrentStep(7);
            } else if (["pending", "rejected"].includes(data.status)) {
              setQuote((prev) => ({ ...prev!, paymentStatus: data.status }));
              setCurrentStep(8);
            }
          } else {
            console.warn("⚠️ /api/payment-status no devolvió quote");
          }
        })
        .catch((err) => {
          console.error("❌ Error consultando estado de pago:", err);
        });
    }
  }, []);

  // ⏳ Timer splash
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);

      if (window?.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

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
        return <Step7Confirmation formData={formData} quote={quote} restart={restart} />;
      case 8:
        return <StepPaymentError formData={formData} quote={quote} restart={restart} />;
      default:
        return <Step1UserInfo formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
    }
  };

  const isFinalStep = currentStep === 7 || currentStep === 8;

  return (
    <div className="bg-gradient-to-b from-slate-700 to-slate-500 min-h-screen font-sans flex items-center justify-center p-4 relative">
      {!isFinalStep && Array.isArray(STEPS) && currentStep <= (STEPS?.length ?? 0) && (
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

              {!isFinalStep && Array.isArray(STEPS) && currentStep <= (STEPS?.length ?? 0) && (
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
