import React, { useState, useMemo } from "react";
import { Quote, FormData } from "../types";
import { Wallet } from "@mercadopago/sdk-react";

interface Props {
  quote: Quote | null;
  formData: FormData;
  prevStep: () => void;
  onPaymentSuccess: (status: string) => void; // 👈 ahora recibe status
  onPaymentFailure: () => void;
}

const Step6Payment: React.FC<Props> = ({
  quote,
  formData,
  prevStep,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const initialization = useMemo(() => {
    return preferenceId ? { preferenceId } : null;
  }, [preferenceId]);

  // 👉 Crear preferencia en backend
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
      const prefId = data.id || data.preferenceId;
      if (!prefId) throw new Error("No se recibió un preferenceId válido");
      setPreferenceId(prefId);
    } catch (err) {
      console.error("❌ Error creando preferencia:", err);
      onPaymentFailure();
    }
  };

  // 👉 Pago presencial (domicilio / taller)
  const handlePayOnSite = async () => {
  if (!quote) return;

  setLoading(true);
  try {
    const response = await fetch("/api/confirm-onsite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, quote }),
    });

    const data = await response.json();
    console.log("📦 confirm-onsite ->", data);

    if (response.ok && data?.success) {
      // data.estado.code === "cash_home"
      // data.calendarEventId disponible
      quote.paymentStatus = data.estado.code; 
    } else {
      throw new Error(data?.error || "Fallo confirm-onsite");
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
        initialization && (
          <div className="flex justify-center">
            <Wallet
              initialization={initialization}
              onSubmit={async (paramData) => {
                const paymentId =
                  paramData.id ||
                  paramData.response?.id ||
                  paramData.response?.payment?.id;

                if (!paymentId) {
                  console.error("❌ No se encontró paymentId:", paramData);
                  onPaymentFailure();
                  return;
                }

                try {
                  const res = await fetch("/api/confirm-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ formData, quote, paymentId }),
                  });

                  const data = await res.json();
                  if (data.success && data.estado?.code) {
                    onPaymentSuccess(data.estado.code); // 👈 pasa status real de MP
                  } else {
                    console.error("⚠️ Error en confirmación:", data.error);
                    onPaymentFailure();
                  }
                } catch (err) {
                  console.error("❌ Error confirmando pago:", err);
                  onPaymentFailure();
                }
              }}
              onError={(err) => {
                console.error("❌ Error desde Wallet Brick:", err);
                onPaymentFailure();
              }}
            />
          </div>
        )
      )}

      <p className="text-xs text-slate-500">Serás redirigido a Mercado Pago</p>

      {/* Pago presencial */}
      <button
        onClick={handlePayOnSite}
        disabled={loading}
        className="w-full px-4 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Abonar en domicilio / taller"}
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
