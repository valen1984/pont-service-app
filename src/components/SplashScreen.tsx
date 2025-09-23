import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LogoHeader from "@/components/LogoHeader";

type SplashProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashProps) {
  const mensajes = [
    "🚀 Preparando tu experiencia...",
    "🔧 Configurando servicios...",
    "✨ Cargando recursos...",
  ];

  const [step, setStep] = useState(0);

  // Cambiar mensaje cada 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % mensajes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Ocultar splash a los 6s
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] p-6 bg-gradient-to-b from-sky-900 via-sky-800 to-sky-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-6">
        {/* Logo centrado */}
        <LogoHeader />
      </div>

      {/* Mensajes dinámicos */}
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="text-lg sm:text-xl text-slate-700 font-medium mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          {mensajes[step]}
        </motion.p>
      </AnimatePresence>

      {/* Footer */}
      <p className="text-xs text-slate-400">Powered by ALVAREZ LLC</p>
    </motion.div>
  );
}
