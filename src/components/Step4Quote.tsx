import React, { useState, useEffect } from "react";
import type { FormData, Quote } from "../types";
import { calculateQuote } from "../../services/mockApi";

interface Props {
  formData: FormData;
  setQuote: (quote: Quote) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
  </div>
);

const Step4Quote: React.FC<Props> = ({ formData, setQuote, nextStep, prevStep }) => {
  const [localQuote, setLocalQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      setIsLoading(true);
      const newQuote = await calculateQuote(formData);
      setLocalQuote(newQuote);
      setQuote(newQuote);
      setIsLoading(false);
    };

    fetchQuote();
  }, [formData, setQuote]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-center mb-2">Calculando presupuesto...</h2>
        <p className="text-center text-slate-500 mb-6">Por favor, espere un momento.</p>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Presupuesto Estimado</h2>
      </div>

      <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
        <div className="flex justify-between">
          <span className="text-slate-600">Localidad de instalación:</span>
          <span className="font-medium">{localQuote?.location}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Costo base:</span>
          <span className="font-medium">{formatCurrency(localQuote?.baseCost || 0)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Costo por traslado:</span>
          <span
            className={`font-medium ${
              localQuote?.travelCost === "💵 Bonificado" ? "text-green-600" : "text-slate-800"
            }`}
          >
            {typeof localQuote?.travelCost === "string"
              ? localQuote.travelCost
              : formatCurrency(localQuote?.travelCost || 0)}
          </span>
        </div>

        <hr className="my-2" />

        <div className="flex justify-between">
          <span className="text-slate-600">Subtotal:</span>
          <span className="font-medium">{formatCurrency(localQuote?.subtotal || 0)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">IVA (21%):</span>
          <span className="font-medium">{formatCurrency(localQuote?.iva || 0)}</span>
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatCurrency(localQuote?.total || 0)}</span>
        </div>
      </div>

      <p className="text-xs text-center text-slate-500">
        ℹ️ Atención: El presupuesto se mantendrá vigente durante los proximos 7 dias y estara sujeto a cambios de ultimo momento; especialmente por cualquier variacion de precios de proveedores o materiales a partir de la fecha de pago o abono en domicilio.
        <br />
        🚗 Los primeros 5 km de traslado desde General Villegas están <b>bonificados</b>.
      </p>

      <div className="flex gap-4 pt-2">
        <button
          onClick={prevStep}
          className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={nextStep}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
        >
          Aceptar y Continuar al Turno
        </button>
      </div>
    </div>
  );
};

export default Step4Quote;
