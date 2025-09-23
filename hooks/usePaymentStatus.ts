import { useEffect, useState } from "react";
import { FormData, Quote } from "../types";

interface PaymentStatusData {
  status: string; // estado crudo de MP: approved, rejected, pending
  paymentStatus: "confirmed" | "rejected" | "pending" | "-";
  formData: FormData;
  quote: Quote;
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

        // 👇 Transformamos el status crudo de MP a tu enum interno
        let mapped: PaymentStatusData = {
          status: json.status,
          paymentStatus:
            json.status === "approved"
              ? "confirmed"
              : json.status === "pending"
              ? "pending"
              : json.status === "rejected"
              ? "rejected"
              : "-",
          formData: json.formData,
          quote: json.quote,
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
  }, [paymentId]);

  return { data, loading, error };
}
