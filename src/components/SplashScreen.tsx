import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

const messages = [
  "❄️ Activando modo invierno...",
  "☀️ Preparando modo split...",
  "🚀 Cargando servicios...",
];

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [fade, setFade] = useState(true);

  // Cambiar mensaje cada 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
        setFade(true);
      }, 500);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Finalizar splash después de 6s
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, messages.length * 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-600 to-sky-800 relative overflow-hidden text-white">
      {/* Emoji central */}
      <div className="text-7xl mb-6 drop-shadow-lg">🌨️</div>

      {/* Barra de progreso */}
      <div className="w-64 h-2 bg-sky-300 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-white animate-[progress_6s_linear]"></div>
      </div>

      {/* Mensajes */}
      <p
        className={`text-center text-lg h-6 transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {messages[currentMessage]}
      </p>

      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-sky-200 text-center">
        <p>Powered by ALVAREZ LLC</p>
        <p>© {new Date().getFullYear()}</p>
      </div>

      {/* Copos de nieve */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => {
          const size = 12 + Math.random() * 16;
          const duration = 4 + Math.random() * 6;
          const delay = Math.random() * 8;
          const left = Math.random() * 100;
          const startY = -50 - Math.random() * 200;
          const driftClass = Math.random() > 0.5 ? "drift-left" : "drift-right";

          return (
            <div
              key={i}
              className={`absolute animate-fall ${driftClass}`}
              style={{
                left: `${left}%`,
                top: `${startY}px`,
                fontSize: `${size}px`,
                opacity: Math.random() * 0.8 + 0.2,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            >
              ❄️
            </div>
          );
        })}
      </div>

      <style>
        {`
          @keyframes fall {
            0%   { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
          .animate-fall {
            animation-name: fall;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }

          /* Variaciones de deriva */
          .drift-left {
            animation-direction: normal;
            animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
          }
          .drift-right {
            animation-direction: alternate;
            animation-timing-function: cubic-bezier(0.55, 0.05, 0.45, 0.95);
          }

          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default SplashScreen;
