import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Snowfall from "react-snowfall";

type SplashProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashProps) {
  const [step, setStep] = useState(0);

  const mensajes = [
    "✨ Preparando magia...",
    "📦 Cargando recursos...",
    "🚀 Listo para comenzar..."
  ];

  // Cambiar mensajes cada 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % mensajes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Redirigir a los 6s
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Nieve fija */}
      <Snowfall style={{ position: "absolute", width: "100%", height: "100%" }} />

      {/* Mensajes animados */}
      <motion.p
        key={step}
        className="text-lg sm:text-xl text-center text-slate-700 font-medium z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {mensajes[step]}
      </motion.p>
    </motion.div>
  );
}
