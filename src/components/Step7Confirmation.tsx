import React, { useEffect, useState } from "react";
import { FormData, Quote } from "../../types";

interface Props {
  formData: FormData;
  quote: Quote | null;
  restart: () => void;
}

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Step7Confirmation: React.FC<Props> = ({ formData, quote, restart }) => {
  const [paymentData, setPaymentData] = useState<{ formData: FormData; quote: Quote } | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get("payment_id"); // Mercado Pago manda esto

    if (paymentId) {
      fetch(`/api/payment-status/${paymentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "approved") {
            setPaymentData({ formData: data.formData, quote: data.quote });
          }
        })
        .catch((err) => console.error("Error consultando pago:", err));
    }
  }, []);

  const data = paymentData || { formData, quote };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold">¡Servicio Confirmado!</h2>
      <p className="text-slate-600">
        Gracias, {data.formData?.fullName}. Tu pago fue aprobado y el servicio quedó agendado.  
        Recibirás un correo con todos los detalles.
      </p>
      <div className="text-left p-4 bg-slate-50 rounded-lg space-y-2">
        <div><span className="font-semibold">Servicio: </span>{data.formData?.serviceType}</div>
        <div><span className="font-semibold">Fecha: </span>{data.formData?.appointmentSlot?.day}, {data.formData?.appointmentSlot?.time}hs</div>
        <div><span className="font-semibold">Dirección: </span>{data.formData?.address}, {data.formData?.location}</div>
        <div><span className="font-semibold">Total Pagado: </span>{formatCurrency(data.quote?.total || 0)}</div>
      </div>
      <button
        onClick={restart}
        className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
      >
        Ir al inicio
      </button>
    </div>
  );
};

export default Step7Confirmation;
