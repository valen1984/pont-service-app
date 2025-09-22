import React, { useEffect } from "react";
import { motion } from "framer-motion";
import LogoHeader from "@/components/LogoHeader";

type SplashProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 4000); // dura 4s y luego va a Step1
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-6">
        <LogoHeader /> {/* 👈 tu logo en el círculo */}
      </div>
      <p className="text-lg sm:text-xl text-slate-700 font-medium mb-8">
        🚀 Preparando tu experiencia...
      </p>
      <p className="text-xs text-slate-400">Powered by ALVAREZ LLC</p>
    </motion.div>
  );
}
