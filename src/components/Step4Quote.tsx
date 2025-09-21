import React, { useEffect, useState } from "react";
import type { FormData, Quote } from "../../types";
import { SERVICE_BASE_PRICES, COST_PER_KM, IVA_RATE } from "../../constants.ts";

interface Props {
  formData: FormData;
  setQuote: (quote: Quote) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const Step4Quote: React.FC<Props> = ({ formData, setQuote, nextStep, prevStep }) => {
  const [quote, setLocalQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!formData.serviceType) return;

    // 💰 Precio base del servicio
    const baseCost = SERVICE_BASE_PRICES[formData.serviceType] || 0;

    // 🚗 Costo de traslado (ejemplo fijo por ahora)
    const travelCost = 1000; // podés reemplazar por cálculo de km si tenés coords

    const subtotal = baseCost + travelCost;
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    const newQuote: Quote = {
      baseCost,
      travelCost,
      subtotal,
      iva,
      total,
    };

    setLocalQuote(newQuote);
    setQuote(newQuote); // 👈 lo mandamos al padre
  }, [formData.serviceType, setQuote]);

  if (!quote) {
    return <p className="text-center text-slate-500">Calculando presupuesto...</p>;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">Presupuesto</h2>
      <div className="p-4 bg-slate-50 rounded-lg space-y-2">
        <div><span className="font-semibold">Servicio: </span>{formData.serviceType}</div>
        <div><span className="font-semibold">Costo base: </span>{formatCurrency(quote.baseCost)}</div>
        <div><span className="font-semibold">Traslado: </span>{formatCurrency(quote.travelCost)}</div>
        <div><span className="font-semibold">Subtotal: </span>{formatCurrency(quote.subtotal)}</div>
        <div><span className="font-semibold">IVA: </span>{formatCurrency(quote.iva)}</div>
        <div className="font-bold text-lg">
          Total: {formatCurrency(quote.total)}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
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
          Continuar
        </button>
      </div>
    </div>
  );
};

export default Step4Quote;
