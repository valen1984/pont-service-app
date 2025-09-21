import React from "react";
import { FormData, Quote } from "../../types";

interface Props {
  formData: FormData;
  quote: Quote | null;
  restart: () => void;
}

const SuccessIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const Step7Confirmation: React.FC<Props> = ({ formData, quote, restart }) => {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <SuccessIcon className="w-16 h-16 text-green-500" />
      </div>

      <h2 className="text-2xl font-bold">¡Servicio Confirmado!</h2>
      <p className="text-slate-600">
        Gracias, <strong>{formData.fullName || "usuario"}</strong>. Tu pago fue aprobado y el servicio quedó agendado. 
        Recibirás un correo con todos los detalles.
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
          <strong>Total Pagado:</strong>{" "}
          {new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
          }).format(quote?.total || 0)}
        </p>
      </div>

      <button
        onClick={restart}
        className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
      >
        Ir al inicio
      </button>
    </div>
  );
};

export default Step7Confirmation;
