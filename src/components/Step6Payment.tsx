import React, { useEffect, useState } from "react";
import { Quote, FormData } from "../../types";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

interface Props {
  quote: Quote | null;
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
  prevStep: () => void;
  formData: FormData;
}

const Step6Payment: React.FC<Props> = ({
  quote,
  onPaymentSuccess,
  onPaymentFailure,
  prevStep,
  formData,
}) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  useEffect(() => {
    // ⚡ Usamos la PUBLIC_KEY de Mercado Pago desde .env
    const mpPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    if (mpPublicKey) {
      initMercadoPago(mpPublicKey);
    } else {
      console.error("⚠️ Falta VITE_MERCADOPAGO_PUBLIC_KEY en .env");
    }
  }, []);

  const createPreference = async () => {
    if (!quote) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/create_preference`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Servicio técnico Pont",
            quantity: 1,
            unit_price: quote.total,
            formData,
            quote,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.id) {
        setPreferenceId(data.id);
      } else {
        throw new Error("No se recibió preferenceId");
      }
    } catch (error) {
      console.error("❌ Error creando preferencia:", error);
      onPaymentFailure();
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

      <p className="text-xs text-slate-500">
        Serás redirigido a Mercado Pago para finalizar tu compra
      </p>

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
