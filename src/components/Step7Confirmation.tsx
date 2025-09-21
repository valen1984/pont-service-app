import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormData, Quote } from "../../types";

interface PaymentStatusResponse {
  status: string;
  formData?: FormData;
  quote?: Quote;
}

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const Step7Confirmation: React.FC = () => {
  const { paymentId } = useParams(); // ⚡ lo tomás desde la URL con React Router
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "approved" | "rejected">("loading");
  const [details, setDetails] = useState<PaymentStatusResponse | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment-status/${paymentId}`);
        const data: PaymentStatusResponse = await res.json();
        if (data.status === "approved") {
          setStatus("approved");
          setDetails(data);
        } else {
          setStatus("rejected");
        }
      } catch (err) {
        console.error("❌ Error verificando pago:", err);
        setStatus("rejected");
      }
    };

    checkStatus();
  }, [paymentId]);

  if (status === "loading") {
    return <p className="text-center">⏳ Verificando pago...</p>;
  }

  if (status === "rejected") {
    return (
      <div className="space-y-6 text-center">
        <p className="text-red-600 text-xl font-bold">❌ El pago fue rechazado.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold">¡Pago procesado con éxito!</h2>
      <p className="text-slate-600">
        Gracias, {details?.formData?.fullName}. Tu servicio quedó confirmado.
      </p>

      <div className="text-left p-4 bg-slate-50 rounded-lg space-y-2">
        <div><span className="font-semibold">Servicio:</span> {details?.formData?.serviceType}</div>
        <div><span className="font-semibold">Fecha:</span> {details?.formData?.appointmentSlot?.day}, {details?.formData?.appointmentSlot?.time}hs</div>
        <div><span className="font-semibold">Dirección:</span> {details?.formData?.address}, {details?.formData?.location}</div>
        <div><span className="font-semibold">Total Pagado:</span> 
          {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(details?.quote?.total || 0)}
        </div>
      </div>

      {/* 🔙 Botón para volver al inicio */}
      <button
        onClick={() => navigate("/")}
        className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
      >
        🏠 Volver al inicio
      </button>
    </div>
  );
};

export default Step7Confirmation;
