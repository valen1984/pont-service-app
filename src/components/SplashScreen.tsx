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

  // Cambiar mensaje cada 2 segundos con fade
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // fade out
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
        setFade(true); // fade in
      }, 500);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Finalizar splash después de 6s (3 mensajes)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, messages.length * 2000); // 6000 ms
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-sky-50 relative overflow-hidden">
      {/* Emoji central */}
      <div className="text-7xl mb-6">🌨️</div>

      {/* Barra de progreso */}
      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-sky-600 animate-[progress_6s_linear]"></div>
      </div>

      {/* Mensajes con fade */}
      <p
        className={`text-center text-slate-700 text-lg h-6 transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {messages[currentMessage]}
      </p>

      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-slate-500 text-center">
        <p>Powered by ALVAREZ LLC</p>
        <p>© {new Date().getFullYear()}</p>
      </div>

      {/* Copitos de nieve cayendo */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute text-lg animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-Math.random() * 100}px`, // 👈 empieza en distintas alturas, no fijos arriba
              animationDuration: `${3 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            ❄️
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(0); opacity: 1; }
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
