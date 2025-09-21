import React, { useState } from "react";
import { FormData, Quote } from "./types";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Wizard from "./Wizard.tsx";
import Step7Confirmation from "@/components/Step7Confirmation";
import StepPaymentError from "@/components/StepPaymentError";

const initialFormData: FormData = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  location: "",
  serviceType: "",
  brand: "",
  model: "",
  photos: [],
  appointmentSlot: null,
};

function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [quote, setQuote] = useState<Quote | null>(null);

  const restart = () => {
    setFormData(initialFormData);
    setQuote(null);
    window.location.hash = "/"; // volver al wizard
  };

  return (
    <Router>
      <div className="bg-slate-100 min-h-screen font-sans flex items-center justify-center p-4">
        <main className="max-w-xl w-full">
          <Routes>
            <Route path="/" element={<Wizard setFormData={setFormData} setQuote={setQuote} />} />
            <Route
              path="/success"
              element={<Step7Confirmation formData={formData} quote={quote} restart={restart} />}
            />
            <Route
              path="/failure"
              element={<StepPaymentError formData={formData} quote={quote} restart={restart} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
