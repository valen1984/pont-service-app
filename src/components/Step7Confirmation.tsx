import React, { useEffect } from "react";
import { FormData, Quote } from "../types";

interface Props {
  formData: FormData;
  quote: Quote | null;
  restart: () => void;
  loading?: boolean;
}

const Step7Confirmation: React.FC<Props> = ({ formData, quote, restart, loading }) => {
  const paymentStatus = quote?.paymentStatus ?? "-";

  useEffect(() => {
    console.log("📌 Step7Confirmation montado");
    console.log("➡️ formData recibido:", formData);
    console.log("➡️ quote recibido:", quote);
    console.log("➡️ paymentStatus:", paymentStatus);
  }, [formData, quote, paymentStatus]);

  const renderStatusText = () => {
    switch (paymentStatus) {
      case "onSite":
        return <>Tu reserva fue confirmada y abonás <strong>presencialmente</strong>.</>;
      case "confirmed":
        return <>Tu pago fue <strong>aprobado</strong> y el servicio quedó agendado.</>;
      case "rejected":
        return <span className="text-red-600 font-semibold">Tu pago fue rechazado.</span>;
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
      <h2 className="text-2xl font-bold">
        {isError ? "Hubo un problema con tu pago" : "¡Servicio Confirmado!"}
      </h2>
      <p className="text-slate-600">
        Gracias, <strong>{formData.fullName || "usuario"}</strong>. {renderStatusText()}
      </p>

      <div className="p-4 border rounded-lg bg-slate-50 text-left space-y-2">
        <p><strong>Servicio:</strong> {formData.serviceType || "-"}</p>
        <p>
          <strong>Fecha:</strong>{" "}
          {formData.appointmentSlot
            ? `${formData.appointmentSlot.date}, ${formData.appointmentSlot.time} hs`
            : "-"}
        </p>
        <p><strong>Dirección:</strong> {formData.address || "-"}</p>
        <p>
          <strong>Total:</strong>{" "}
          {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
            quote?.total ?? 0
          )}
        </p>
        <p><strong>Estado:</strong> {renderStatusLabel()}</p>
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
