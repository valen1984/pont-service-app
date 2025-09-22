import React, { useState } from "react";
import type { FormData } from "../../types";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
}

const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.42-.25.69-.441C12.49 17.346 14.22 15.39 15.5 13c1.28-2.39 1.5-4.999 1.5-6.5C17 2.925 13.866 0 10 0S3 2.925 3 6.5c0 1.501.22 4.11 1.5 6.5 1.28 2.39 3.01 4.346 4.192 5.352.27.19.504.34.69.44a5.741 5.741 0 00.28.14l.018.008.006.003zM10 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
      clipRule="evenodd"
    />
  </svg>
);

const localidades = [
  "General Villegas",
  "Piedritas",
  "Cañada Seca",
  "Emilio V. Bunge",
  "Coronel Charlone",
  "Santa Regina",
  "Villa Sauze",
  "Elordi",
  "Ameghino",
  "Carlos Tejedor",
  "Trenque Lauquen",
  "America (Rivadavia)",
  "Eduardo Castex",
  "General Pico",
  "Intendente Alvear",
  "Villa Huidobro",
  "Rufino",
];

const Step1UserInfo: React.FC<Props> = ({
  formData,
  updateFormData,
  nextStep,
}) => {
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "fullName") {
      if (value.length <= 50) {
        updateFormData({ fullName: value });
      }
      return;
    }

    if (name === "phone") {
      const onlyNumbers = value.replace(/\D/g, ""); // solo dígitos
      updateFormData({ phone: onlyNumbers });
      return;
    }

    if (name === "email") {
      updateFormData({ email: value });
      return;
    }

    if (name === "address") {
      updateFormData({ [name]: value, coords: undefined });
    } else if (name === "location") {
      updateFormData({ location: value, coords: undefined });
    } else {
      updateFormData({ [name]: value });
    }
  };

  const isFormValid = () => {
    return (
      formData.fullName &&
      formData.phone &&
      formData.email &&
      formData.address &&
      formData.location
    );
  };

  const emailDomains = ["gmail.com", "hotmail.com", "cloud.com"];
  const emailSuggestions =
    formData.email && formData.email.includes("@") === false
      ? emailDomains.map((domain) => `${formData.email}@${domain}`)
      : [];

  return (
    <div className="space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <label
          htmlFor="fullName"
          className="text-sm font-medium text-slate-600"
        >
          Nombre y Apellido (máx. 50 caracteres)
        </label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
          required
        />
        <p className="text-xs text-slate-500 text-right">
          {formData.fullName.length}/50
        </p>
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-slate-600">
          Teléfono (solo números)
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-600">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
          required
        />
        {emailSuggestions.length > 0 && (
          <ul className="mt-1 text-sm text-sky-100 bg-sky-700 rounded-lg overflow-hidden">
            {emailSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                className="px-2 py-1 cursor-pointer hover:bg-sky-600"
                onClick={() => updateFormData({ email: suggestion })}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <label
          htmlFor="address"
          className="text-sm font-medium text-slate-600"
        >
          Dirección
        </label>
        <input
          type="text"
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
          placeholder="Calle y número o Ruta y Km"
          required
        />
      </div>

      {/* Localidad */}
      <div className="space-y-2">
        <label
          htmlFor="location"
          className="text-sm font-medium text-slate-600"
        >
          Localidad
        </label>
        <select
          name="location"
          id="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
          required
        >
          <option value="">Seleccioná una localidad</option>
          {localidades.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Siguiente */}
      <button
        onClick={nextStep}
        disabled={!isFormValid()}
        className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-slate-300 transition-colors"
      >
        Siguiente
      </button>
    </div>
  );
};

export default Step1UserInfo;
