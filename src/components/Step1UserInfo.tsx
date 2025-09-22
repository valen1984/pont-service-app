import React, { useState, useEffect } from "react";
import type { FormData } from "../../types";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
}

const Step1UserInfo: React.FC<Props> = ({ formData, updateFormData, nextStep }) => {
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  // 🔹 Validar teléfono
  const validatePhone = (phone: string) => /^[0-9]+$/.test(phone);

  // 🔹 Validar email
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.(com|com\.ar)$/i.test(email);

  // 🔹 Revalidar cada vez que cambian los datos
  useEffect(() => {
    const validPhone = formData.phone && validatePhone(formData.phone);
    const validEmail = formData.email && validateEmail(formData.email);

    setIsValid(!!(formData.fullName && validPhone && validEmail));
  }, [formData]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // solo números
    updateFormData({ phone: value });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFormData({ email: value });

    if (value.includes("@")) {
      const [local, domainPart] = value.split("@");
      const domains = ["gmail.com", "hotmail.com", "apple.com"];
      setEmailSuggestions(
        domains
          .filter((d) => d.startsWith(domainPart))
          .map((d) => `${local}@${d}`)
      );
    } else {
      setEmailSuggestions([]);
    }
  };

  const validateAndNext = () => {
    const newErrors: { phone?: string; email?: string } = {};

    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = "El teléfono debe contener solo números";
    }

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = "Ingresa un correo válido (ej: nombre@gmail.com)";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">Información de contacto</h2>

      {/* Nombre */}
      <div>
        <label className="block font-medium">Nombre completo</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className="block font-medium">Teléfono</label>
        <input
          type="text"
          value={formData.phone}
          onChange={handlePhoneChange}
          className="w-full border rounded-lg px-3 py-2"
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
      </div>

      {/* Email */}
      <div className="relative">
        <label className="block font-medium">Email</label>
        <input
          type="text"
          value={formData.email}
          onChange={handleEmailChange}
          className="w-full border rounded-lg px-3 py-2"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        {emailSuggestions.length > 0 && (
          <ul className="absolute bg-white border rounded-md mt-1 w-full shadow">
            {emailSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                onClick={() => {
                  updateFormData({ email: suggestion });
                  setEmailSuggestions([]);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-100"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Botón siguiente */}
      <button
        onClick={validateAndNext}
        disabled={!isValid}
        className={`w-full px-4 py-3 font-semibold rounded-lg transition-colors ${
          isValid
            ? "bg-sky-600 text-white hover:bg-sky-700"
            : "bg-slate-300 text-slate-600 cursor-not-allowed"
        }`}
      >
        Siguiente
      </button>
    </div>
  );
};

export default Step1UserInfo;
