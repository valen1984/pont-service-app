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

  useEffect(() => {
    // ⚡ Usá tu Public Key de Mercado Pago (modo test primero)
    initMercadoPago("APP_USR-d233f7cd-49c9-45cc-995c-8ac9890765a4");
  }, []);

  const createPreference = async () => {
    if (!quote) return;

    try {
      const response = await fetch("http://localhost:4000/create_preference", {
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
    } catch (error) {
      console.error("Error creando preferencia:", error);
      onPaymentFailure();
    }
  };

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
