import React, { useEffect, useState } from "react";
import { Quote, FormData } from "../../types";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

interface Props {
  quote: Quote | null;
  prevStep: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
}

const Step6Payment: React.FC<Props> = ({ quote, prevStep, onPaymentSuccess, onPaymentFailure }) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  useEffect(() => {
    // ⚡ Usá la Public Key (modo test primero)
    initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || "");
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
          formData: {}, // 👈 si querés pasar datos del cliente acá
          quote,
        }),
      });

      if (!response.ok) {
        throw new Error("Error creando preferencia en el backend");
      }

      const data = await response.json();
      setPreferenceId(data.id);
    } catch (error) {
      console.error("❌ Error creando preferencia:", error);
      onPaymentFailure();
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-bold">¿Realizar el pago?</h2>

      <p className="text-5xl font-bold tracking-tighter text-slate-800">
        {formatCurrency(quote?.total || 0)}
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
