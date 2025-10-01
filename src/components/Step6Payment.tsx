import React, { useState, useMemo, useEffect } from "react";
import { Quote, FormData } from "../types";

interface Props {
  quote: Quote | null;
  formData: FormData;
  onPayOnSite: () => void;
  prevStep: () => void;
  onPaymentSuccess: (estado?: string) => void;
  onPaymentFailure: () => void;
}

const Step6Payment: React.FC<Props> = ({
  quote,
  formData,
  onPayOnSite,
  prevStep,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [WalletComponent, setWalletComponent] = useState<any>(null);

  // ⚡ Lazy load del SDK de Mercado Pago SOLO al entrar en Step6
  useEffect(() => {
    (async () => {
      try {
        const { Wallet, initMercadoPago } = await import("@mercadopago/sdk-react");

        const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
        if (!publicKey || publicKey === "undefined") {
          console.warn("⚠️ PUBLIC_KEY ausente, no se inicializa Mercado Pago");
          console.log("🌍 import.meta.env:", import.meta.env);
          return;
        }

        console.log("🔑 Init MercadoPago con key:", publicKey);
        initMercadoPago(publicKey, { locale: "es-AR" });

        setWalletComponent(() => Wallet);
        console.log("✅ SDK de Mercado Pago listo para usar Wallet");
      } catch (err) {
        console.error("❌ Error cargando SDK MercadoPago:", err);
      }
    })();
  }, []);

  // ✅ Memorizar initialization
  const initialization = useMemo(() => {
    return preferenceId ? { preferenceId } : null;
  }, [preferenceId]);

  // 👉 Crear preferencia en el backend
  // 👉 Crear preferencia en el backend
const createPreference = async () => {
  if (!quote) return;
  setLoading(true);

  try {
    // ✅ Guardar antes de redirigir a MP
    localStorage.setItem("formData", JSON.stringify(formData));
    localStorage.setItem("quote", JSON.stringify(quote));

    const response = await fetch("/api/create_preference", {
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
    console.log("📦 Respuesta create_preference:", data);

    const prefId = data.id || data.preferenceId;
    if (!prefId) throw new Error("No se recibió un preferenceId válido");

    setPreferenceId(prefId);
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    onPaymentFailure();
  } finally {
    setLoading(false);
  }
};

  // 👉 Pago presencial
  const handlePayOnSite = async () => {
    if (!quote) return;
    setLoading(true);

    try {
      console.log("📤 Enviando confirm-onsite:", { formData, quote });

      const response = await fetch("/api/confirm-onsite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, quote }),
      });

      const data = await response.json();
      console.log("📦 Respuesta confirm-onsite:", data);

      if (data.success) {
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
          disabled={loading}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-md disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Pagar con Mercado Pago"}
        </button>
      ) : (
        initialization &&
        WalletComponent && (
          <div className="flex justify-center w-full mt-4">
            <div className="w-[300px]">
              {console.log("🟦 Renderizando Wallet con prefId:")}
              <WalletComponent initialization={initialization} />
            </div>
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
