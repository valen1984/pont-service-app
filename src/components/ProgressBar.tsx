import React from "react";
import { motion } from "framer-motion";

interface Props {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const ProgressBar: React.FC<Props> = ({ currentStep, totalSteps, labels }) => {
  return (
    <div className="flex flex-col w-full mb-6">
      {/* Línea + círculos */}
      <div className="relative flex items-center justify-between">
        {/* Línea de fondo */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 rounded-full -translate-y-1/2" />

        {/* Línea de progreso */}
        <motion.div
          className="absolute top-1/2 left-0 h-1 bg-sky-500 rounded-full -translate-y-1/2"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.4 }}
        />

        {/* Círculos de pasos */}
        {labels.map((label, index) => {
          const stepIndex = index + 1;
          const isCompleted = stepIndex < currentStep;
          const isActive = stepIndex === currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center text-center w-full"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isCompleted
                    ? "bg-sky-500 border-sky-500 text-white"
                    : isActive
                    ? "bg-white border-sky-500 text-sky-500"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {isCompleted ? "✓" : stepIndex}
              </div>
              <span
                className={`mt-2 text-xs ${
                  isCompleted || isActive ? "text-sky-600 font-semibold" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
