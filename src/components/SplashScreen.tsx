import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Snowfall from "react-snowfall";

type SplashProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashProps) {
  const [step, setStep] = useState(0);

  const mensajes = [
    "⏳ Preparando magia...",
    "🔧 Configurando servicios...",
    "🚀 Listo para comenzar..."
  ];

  const emojis = ["☁️", "🌥️", "☀️", "🌧️"];

  // Rotar mensajes y emojis
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
      className="relative flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] bg-sky-500 text-white overflow-hidden rounded-2xl shadow-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Nieve suave de fondo */}
      <Snowfall
        style={{ position: "absolute", width: "100%", height: "100%" }}
        snowflakeCount={40}
      />

      {/* Nube con emoji */}
      <motion.div
        className="relative flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            className="text-5xl sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {emojis[step % emojis.length]}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Mensajes de carga */}
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="mt-6 text-lg sm:text-xl font-medium text-center drop-shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          {mensajes[step]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
