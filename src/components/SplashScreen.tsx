import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

const messages = [
  "❄️ Activando modo invierno...",
  "☀️ Activando modo split, ¿listo para el verano?",
  "🚀 Cargando servicios...",
];

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [currentMessage, setCurrentMessage] = useState(0);

  // Rotar mensajes cada 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Finalizar después de 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-sky-50 relative overflow-hidden">
      {/* Emoji central */}
      <div className="text-7xl mb-6">🌨️</div>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-sky-600 animate-[progress_5s_linear]"></div>
      </div>

      {/* Mensajes animados */}
      <div className="h-8 overflow-hidden relative w-72 text-center">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`absolute inset-0 transition-all duration-700 ${
              i === currentMessage
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-5"
            }`}
          >
            {msg}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-slate-500 text-center">
        <p>Powered by ALVAREZ LLC</p>
        <p>© 2025</p>
      </div>

      {/* 🌨️ Pequeños copos animados */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-lg animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            ❄️
          </div>
        ))}
      </div>

      {/* Animaciones con Tailwind */}
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-10%); opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
          .animate-fall {
            animation-name: fall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
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
