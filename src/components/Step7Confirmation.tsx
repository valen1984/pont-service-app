import React, { useEffect, useState } from "react"; // 👈 agregamos useEffect y useState
import { FormData, Quote } from "../types";

interface Props {
  formData: FormData;
  quote: Quote | null;
  restart: () => void;
  loading?: boolean;
}

const Step7Confirmation: React.FC<Props> = ({ formData, quote, restart, loading }) => {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentStatus = quote?.paymentStatus ?? "-"; // ✅ fallback seguro

  // 🚀 Confirmar automáticamente en el backend
  useEffect(() => {
    const confirm = async () => {
      if (!quote || !formData) return;

      // Solo confirmamos si fue pago aprobado o presencial
      if (paymentStatus === "confirmed" || paymentStatus === "onSite") {
        try {
          setConfirming(true);
          const res = await fetch("/api/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formData, quote }),
          });

          const data = await res.json();
          if (!data.ok) {
            setError(data.error || "Error al confirmar el pago");
          } else {
            console.log("✅ Confirmación registrada y evento creado en Calendar");
          }
        } catch (err: any) {
          setError("Error de conexión con el servidor");
        } finally {
          setConfirming(false);
        }
      }
    };

    confirm();
  }, [formData, quote, paymentStatus]);

  // 🔄 Mientras espera confirmación
  if (loading || confirming) {
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

  // 🚨 Si falla la confirmación
  if (error) {
    return (
      <div className="space-y-6 text-center text-red-600">
        <h2 className="text-xl font-bold">❌ Error en la confirmación</h2>
        <p>{error}</p>
        <button
          onClick={restart}
          className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // 👉 todo lo tuyo sigue igual
  const renderStatusText = () => {
    switch (paymentStatus) {
      case "onSite":
        return (
          <>
            Tu reserva fue confirmada y abonás <strong>presencialmente</strong>.
            Recibirás un correo con todos los detalles.
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

export default Step7Confirmation;
