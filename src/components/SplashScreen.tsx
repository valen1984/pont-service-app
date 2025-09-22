import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const funnyMessages = [
  "⛄ Activando modo invierno...",
  "🌞 Preparando el modo split...",
  "❄️ Cargando frescura garantizada...",
  "🔧 Ajustando los tornillos virtuales...",
];

const snowflakes = ["❄️", "✨", "❄️", "❄️", "❅", "❄️"];

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % funnyMessages.length);
    }, 1500);

    const timeout = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
      clearTimeout(timeout);
    };
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50 relative overflow-hidden">
      {/* ❄️ Emoji central */}
      <div className="text-7xl mb-6">❄️</div>

      {/* Copos cayendo */}
      {snowflakes.map((flake, i) => (
        <motion.div
          key={i}
          className="absolute text-xl"
          style={{ top: -20, left: `${15 + i * 15}%` }}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: "100vh", opacity: [0, 1, 0] }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          {flake}
        </motion.div>
      ))}

      {/* Barra de progreso */}
      <div className="w-64 bg-slate-200 rounded-full h-4 overflow-hidden mb-4">
        <div
          className="h-4 bg-sky-600 transition-all duration-200"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Mensajes con animación carrusel */}
      <div className="h-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="text-slate-700 font-medium absolute w-full text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {funnyMessages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-xs text-slate-500">
        Powered by <span className="font-bold">ALVAREZ LLC</span> ©{" "}
        {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default SplashScreen;
