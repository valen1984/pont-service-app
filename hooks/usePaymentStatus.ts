import { useEffect, useState } from "react";
import { FormData, Quote } from "../types";

interface PaymentStatusData {
  status: string; // estado crudo de MP: approved, rejected, pending
  paymentStatus: "confirmed" | "rejected" | "pending" | "-";
  formData: FormData | null;
  quote: Quote | null;
}

export function usePaymentStatus(paymentId: string | null) {
  const [data, setData] = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    const fetchStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/payment-status/${paymentId}`);
        if (!res.ok) throw new Error("No se pudo consultar el pago");

        const json = await res.json();

        // 👇 Mapeamos status crudo de Mercado Pago a nuestro enum interno
        const mapped: PaymentStatusData = {
          status: json.status,
          paymentStatus:
            json.status === "approved"
              ? "confirmed"
              : json.status === "pending"
              ? "pending"
              : json.status === "rejected"
              ? "rejected"
              : "-",
          formData: json.formData || null,
          quote: json.quote || null,
        };

        setData(mapped);
      } catch (err: any) {
        console.error("❌ Error en usePaymentStatus:", err);
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // 👇 Reconsultar cada 5 segundos mientras no esté confirmado/rechazado
    const interval = setInterval(() => {
      if (!data || data.paymentStatus === "pending") {
        fetchStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId]);

  return { data, loading, error };
}
