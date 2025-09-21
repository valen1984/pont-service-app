import React from "react";
import { FormData, Quote } from "../../types";

interface Props {
  formData: FormData;
  quote: Quote | null;
  restart: () => void;
}

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m0 3.75h.007v.007H12v-.007zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const StepPaymentError: React.FC<Props> = ({ formData, quote, restart }) => {
  const handleRetry = () => {
    // 🧹 Limpiar datos guardados
    localStorage.removeItem("formData");
    localStorage.removeItem("quote");

    // 🔄 Reiniciar flujo
    restart();
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <ErrorIcon className="w-16 h-16 text-amber-500" />
      </div>

      <h2 className="text-2xl font-bold">Error en el Pago</h2>
      <p className="text-slate-600">
        Lo sentimos, <strong>{formData.fullName || "usuario"}</strong>.  
        Tu pago fue rechazado o no se pudo procesar. Recibirás un correo con más detalles.
      </p>

      <div className="p-4 border rounded-lg bg-slate-50 text-left space-y-2">
        <p>
          <strong>Servicio:</strong>{" "}
          {formData.serviceType || "-"}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          {formData.appointmentSlot
            ? `${formData.appointmentSlot.date}, ${formData.appointmentSlot.time} hs`
            : "-"}
        </p>
        <p>
          <strong>Dirección:</strong>{" "}
          {formData.address || "-"}
        </p>
        <p>
          <strong>Total Intentado:</strong>{" "}
          {new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
          }).format(quote?.total || 0)}
        </p>
      </div>

      <button
        onClick={handleRetry}
        className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
      >
        Volver a Intentar
      </button>
    </div>
  );
};

export default StepPaymentError;
