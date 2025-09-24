import React, { useEffect } from "react";
import { FormData, Quote } from "../types";

interface Props {
  formData: FormData;
  quote: Quote | null;
  restart: () => void;
  loading?: boolean;
}

const Step7Result: React.FC<Props> = ({ formData, quote, restart, loading }) => {
  const status = quote?.paymentStatus ?? "unknown";
  const isError = status === "rejected";

  // 📌 Debug
  useEffect(() => {
    console.log("📌 Step7Result montado");
    console.log("➡️ formData:", formData);
    console.log("➡️ quote:", quote);
    console.log("➡️ paymentStatus:", status);
  }, [formData, quote, status]);

  if (loading) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold">Procesando tu pago...</h2>
        <p className="text-slate-600">
          Aguarda unos segundos mientras confirmamos la transacción con Mercado Pago.
        </p>
      </div>
    );
  }

  const renderStatusText = () => {
    switch (status) {
      case "approved":
        return (
          <>
            Tu pago fue <strong>aprobado</strong> y el servicio quedó agendado.  
            Recibirás un correo con todos los detalles.
          </>
        );
      case "pending":
      case "in_process":
        return (
          <>
            Tu turno fue reservado correctamente, pero el pago está{" "}
            <span className="text-amber-600 font-semibold">pendiente de acreditación</span>.  
            El turno ya quedó ocupado en la agenda.  
            Te notificaremos por correo apenas se confirme el pago.
          </>
        );
      case "rejected":
        return (
          <>
            <span className="text-red-600 font-semibold">Tu pago fue rechazado.</span>  
            Te enviamos un correo con los pasos para reintentar.
          </>
        );
      case "cash_home":
        return (
          <>
            Tu reserva fue confirmada y abonás <strong>en domicilio</strong>.  
            Recibirás un correo con todos los detalles.
          </>
        );
      case "cash_workshop":
        return (
          <>
            Tu reserva fue confirmada y abonás <strong>en el taller</strong>.  
            Recibirás un correo con todos los detalles.
          </>
        );
      case "unpaid":
        return (
          <>
            Tu orden fue generada pero aún no tiene pago registrado.  
            Recibirás instrucciones por correo para completarla.
          </>
        );
      default:
        return <>Recibirás un correo con el detalle de tu reserva.</>;
    }
  };

  const renderStatusLabel = () => {
    switch (status) {
      case "approved":
        return "✅ Aprobado";
      case "pending":
      case "in_process":
        return "⏳ Pendiente";
      case "rejected":
        return "❌ Rechazado";
      case "cash_home":
        return "🏠 Pago en domicilio";
      case "cash_workshop":
        return "🔧 Pago en taller";
      case "unpaid":
        return "💵 Sin pagar aún";
      default:
        return "📩 Desconocido";
    }
  };

  return (
    <div className="space-y-6 text-center">
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
          }).format(quote?.total ?? 0)}
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

export default Step7Result;
