import React, { useEffect, useState } from "react";
import { FormData, Quote } from "../../types";

interface Props {
  formData: FormData;
  quote: Quote | null;
  restart: () => void;
}

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 
         1.948 3.374h14.71c1.73 0 2.813-1.874 
         1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 
         0L2.697 16.126zM12 15.75h.007v.007H12v-.007z"
    />
  </svg>
);

const StepPaymentError: React.FC<Props> = ({ formData, quote, restart }) => {
  const [paymentData, setPaymentData] = useState<{ formData: FormData; quote: Quote } | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get("payment_id");

    if (paymentId) {
      fetch(`/api/payment-status/${paymentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "rejected") {
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
        <ErrorIcon className="w-16 h-16 text-amber-500" />
      </div>
      <h2 className="text-2xl font-bold">❌ Error en el Pago</h2>
      <p className="text-slate-600">
        Lo sentimos, {data.formData?.fullName}.  
        Tu pago fue <strong>rechazado</strong> o no se pudo procesar.  
        Podés intentar nuevamente con otro medio de pago.
      </p>

      <div className="text-left p-4 bg-slate-50 rounded-lg space-y-2">
        <div><span className="font-semibold">Servicio: </span>{data.formData?.serviceType}</div>
        <div><span className="font-semibold">Fecha: </span>{data.formData?.appointmentSlot?.day}, {data.formData?.appointmentSlot?.time}hs</div>
        <div><span className="font-semibold">Dirección: </span>{data.formData?.address}, {data.formData?.location}</div>
        <div><span className="font-semibold">Total: </span>{formatCurrency(data.quote?.total || 0)}</div>
      </div>

      <div className="flex flex-col gap-4 pt-4">
        <button
          onClick={restart}
          className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default StepPaymentError;
