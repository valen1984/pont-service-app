import React, { useEffect, useState } from "react";
import { Quote, FormData } from "../../types";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { usePaymentStatus } from "../../hooks/usePaymentStatus";

interface Props {
  quote: Quote | null;
  formData: FormData;
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
  onPayOnSite: () => void;
  prevStep: () => void;
}

const Step6Payment: React.FC<Props> = ({
  quote,
  formData,
  onPaymentSuccess,
  onPaymentFailure,
  onPayOnSite,
  prevStep,
}) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: paymentData, loading: statusLoading } = usePaymentStatus(paymentId);

  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) {
      console.error("⚠️ Mercado Pago PUBLIC KEY no definida en .env");
      return;
    }
    // 👇 Forzamos idioma español
    initMercadoPago(publicKey, { locale: "es-AR" });
  }, []);

  // Manejo de estados de pago
  useEffect(() => {
    if (!paymentData) return;

    if (paymentData.paymentStatus === "confirmed") {
      onPaymentSuccess();
    } else if (paymentData.paymentStatus === "rejected") {
      onPaymentFailure();
      // Permite reintentar
      setPreferenceId(null);
      setPaymentId(null);
    }
  }, [paymentData, onPaymentSuccess, onPaymentFailure]);

  const createPreference = async () => {
    if (!quote) return;

    try {
      const response = await fetch("/create_preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Servicio técnico Pont",
          quantity: 1,
          unit_price: quote.total,
          formData,
          quote,
        }),
      });

      const data = await response.json();
      if (!data.id) throw new Error("No se recibió un preferenceId válido");

      setPreferenceId(data.id);
      if (data.paymentId) setPaymentId(data.paymentId);
    } catch (error) {
      console.error("❌ Error creando preferencia:", error);
      onPaymentFailure();
    }
  };

  const handlePayOnSite = async () => {
    if (!quote) return;
    setLoading(true);

    try {
      const response = await fetch("/reservation/onsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, quote }),
      });

      const data = await response.json();
      if (data.ok) {
        console.log("📧 Correo pago presencial enviado");
        onPayOnSite();
      } else {
        alert("Error enviando correo: " + data.error);
      }
    } catch (err: any) {
      console.error("❌ Error en pago presencial:", err);
      alert("No se pudo registrar el pago presencial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-bold">¿Realizar el pago?</h2>

      <p className="text-5xl font-bold tracking-tighter text-slate-800">
        {new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(quote?.total || 0)}
      </p>

      {/* Botón Mercado Pago */}
      {!preferenceId ? (
        <button
          onClick={createPreference}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-md"
        >
          Pagar con Mercado Pago
        </button>
      ) : (
        <div key={preferenceId} className="flex justify-center">
          <Wallet initialization={{ preferenceId }} />
        </div>
      )}

      {statusLoading && <p className="text-xs text-slate-500">Verificando estado de pago...</p>}

      <p className="text-xs text-slate-500">Serás redirigido a Mercado Pago</p>

      {/* Pago presencial */}
      <button
        onClick={handlePayOnSite}
        disabled={loading}
        className="w-full px-4 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Abonar en el domicilio / taller"}
      </button>

      <div className="pt-4">
        <button
          onClick={prevStep}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default Step6Payment;
