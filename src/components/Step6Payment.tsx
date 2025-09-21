import React, { useEffect, useState } from "react";
import { Quote } from "../../types";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

interface Props {
  quote: Quote | null;
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
  prevStep: () => void;
}

const Step6Payment: React.FC<Props> = ({ quote, onPaymentSuccess, onPaymentFailure, prevStep }) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY); // ⚡ ahora lee del .env
  }, []);

  const createPreference = async () => {
    if (!quote) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create_preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Servicio técnico Pont",
          quantity: 1,
          unit_price: quote.total,
        }),
      });

      const data = await response.json();
      setPreferenceId(data.id);
      setPaymentId(data.id); // usamos preferenceId como ID para consultar después
    } catch (error) {
      console.error("Error creando preferencia:", error);
      onPaymentFailure();
    }
  };

  // ✅ Consultar estado del pago
  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payment-status/${paymentId}`);
        const data = await response.json();

        if (data.status === "approved") {
          clearInterval(interval);
          onPaymentSuccess();
        }
      } catch (err) {
        console.error("Error consultando estado del pago:", err);
      }
    }, 5000); // consulta cada 5 segundos

    return () => clearInterval(interval);
  }, [paymentId]);

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-bold">¿Realizar el pago?</h2>

      <p className="text-5xl font-bold tracking-tighter text-slate-800">
        {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
          quote?.total || 0
        )}
      </p>

      {!preferenceId ? (
        <button
          onClick={createPreference}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-md"
        >
          Pagar con Mercado Pago
        </button>
      ) : (
        <div className="flex justify-center">
          <Wallet initialization={{ preferenceId }} />
        </div>
      )}

      <p className="text-xs text-slate-500">Serás redirigido a Mercado Pago</p>

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
