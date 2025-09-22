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
      d="M12 9v2.25m0 3.75h.008v.008H12v-.008zm0-12a9 9 0 110 18 9 9 0 010-18z"
    />
  </svg>
);

const Step7Confirmation: React.FC<Props> = ({ formData, quote, restart }) => {
  const paymentStatus = quote?.paymentStatus;

  const renderStatusText = () => {
    switch (paymentStatus) {
      case "onSite":
        return (
          <>
            Tu reserva fue confirmada y abonás <strong>presencialmente</strong> en
            el domicilio o en el taller. Recibirás un correo con todos los detalles.
          </>
        );
      case "confirmed":
        return (
          <>
            Tu pago fue <strong>aprobado</strong> y el servicio quedó agendado.
            Recibirás un correo con todos los detalles.
          </>
        );
      case "rejected":
        return (
          <>
            <span className="text-red-600 font-semibold">
              Tu pago fue rechazado.
            </span>{" "}
            Te enviamos un correo con los pasos para reintentar.
          </>
        );
      default:
        return <>Recibirás un correo con el detalle de tu reserva.</>;
    }
  };

  const renderStatusLabel = () => {
    if (paymentStatus === "onSite") return "💵 Abona presencialmente";
    if (paymentStatus === "confirmed") return "✅ Confirmado";
    if (paymentStatus === "rejected") return "❌ Rechazado";
    return "-";
  };

  const isError = paymentStatus === "rejected";

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        {isError ? (
          <ErrorIcon className="w-16 h-16 text-red-500" />
        ) : (
          <SuccessIcon className="w-16 h-16 text-green-500" />
        )}
      </div>

      <h2 className="text-2xl font-bold">
        {isError ? "Hubo un problema con tu pago" : "¡Servicio Confirmado!"}
      </h2>
      <p className="text-slate-600">
        Gracias, <strong>{formData.fullName || "usuario"}</strong>.{" "}
        {renderStatusText()}
      </p>

      <div className="p-4 border rounded-lg bg-slate-50 text-left space-y-2">
        <p>
          <strong>Servicio:</strong> {formData.serviceType || "-"}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          {formData.appointmentSlot
            ? `${formData.appointmentSlot.date}, ${formData.appointmentSlot.time} hs`
            : "-"}
        </p>
        <p>
          <strong>Dirección:</strong> {formData.address || "-"}
        </p>
        <p>
          <strong>Total:</strong>{" "}
          {new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
          }).format(quote?.total || 0)}
        </p>
        <p>
          <strong>Estado:</strong> {renderStatusLabel()}
        </p>
      </div>

      <button
        onClick={restart}
        className={`w-full px-4 py-3 font-semibold rounded-lg transition-colors ${
          isError
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-sky-600 text-white hover:bg-sky-700"
        }`}
      >
        Ir al inicio
      </button>
    </div>
  );
};

export default Step7Confirmation;
