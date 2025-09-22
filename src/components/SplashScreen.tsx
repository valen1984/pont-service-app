import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const funnyMessages = [
  "⛄ Activando modo invierno...",
  "❄️ Preparando el split...",
  "☀️ ¿Listo para el verano?",
  "⚡ Cargando sistema PONT...",
  "🔧 Verificando materiales...",
];

const SplashScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  // ⏱ cambiar mensaje cada 1.2s
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % funnyMessages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-200 to-sky-400 relative overflow-hidden">
      {/* Emoji central estático */}
      <div className="text-6xl mb-6">⛄</div>

      {/* Mensajes animados estilo carrusel */}
      <div className="h-8 flex items-center justify-center mb-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-lg font-medium text-slate-700 text-center px-4"
          >
            {funnyMessages[messageIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de carga */}
      <div className="w-64 bg-white/60 rounded-full h-3 overflow-hidden shadow">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 6, ease: "easeInOut" }}
          className="h-full bg-sky-600 rounded-full"
        />
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-sm text-slate-700">
        <p className="font-semibold">Powered by ALVAREZ LLC</p>
        <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
      </div>

      {/* ❄️ Copos de nieve cayendo con giro + viento */}
      {Array.from({ length: 25 }).map((_, i) => {
        const startX = Math.random() * window.innerWidth;
        const rotateStart = Math.random() * 360;
        const rotateEnd = rotateStart + (Math.random() > 0.5 ? 360 : -360);

        return (
          <motion.div
            key={i}
            initial={{
              x: startX,
              y: -50 - Math.random() * 100,
              opacity: 0,
              rotate: rotateStart,
            }}
            animate={{
              y: window.innerHeight + 50,
              x: [
                startX,
                startX + (Math.random() * 40 - 20), // se mueve a izquierda/derecha
                startX,
              ],
              opacity: [0, 1, 1, 0],
              rotate: rotateEnd,
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 6,
              ease: "easeInOut",
            }}
            className="absolute text-white text-lg select-none"
          >
            ❄️
          </motion.div>
        );
      })}
    </div>
  );
};

export default SplashScreen;
