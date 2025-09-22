import React, { useState, useEffect } from "react";
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
  "Piedritas, Provincia de Buenos Aires",
  "Cañada Seca, Provincia de Buenos Aires",
  "Emilio V. Bunge, Provincia de Buenos Aires",
  "Coronel Charlone, Provincia de Buenos Aires",
  "Santa Regina, Provincia de Buenos Aires",
  "Villa Sauze, Provincia de Buenos Aires",
  "Elordi, Provincia de Buenos Aires",
  "Ameghino, Provincia de Buenos Aires",
  "Carlos Tejedor, Provincia de Buenos Aires",
  "Trenque Lauquen, Provincia de Buenos Aires",
  "America (Rivadavia), Provincia de Buenos Aires",
  "Eduardo Castex, Provincia de La Pampa",
  "General Pico, Provincia de La Pampa",
  "Intendente Alvear, Provincia de La Pampa",
  "Villa Huidobro, Provincia de Córdoba",
  "Rufino, Provincia de Santa Fe",
];

const Step1UserInfo: React.FC<Props> = ({ formData, updateFormData, nextStep }) => {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; email?: string; fullName?: string }>({});
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

  // ========================
  // 🔹 Handlers de cambios
  // ========================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numeric = value.replace(/\D/g, "").slice(0, 10); // solo números
      updateFormData({ phone: numeric });
      return;
    }

    if (name === "email") {
      const limited = value.slice(0, 50);
      updateFormData({ email: limited });

      if (limited.includes("@")) {
        const [local, domainPart] = limited.split("@");
        const domains = ["gmail.com", "hotmail.com", "apple.com"];
        setEmailSuggestions(
          domains.filter((d) => d.startsWith(domainPart)).map((d) => `${local}@${d}`)
        );
      } else {
        setEmailSuggestions([]);
      }
      return;
    }

    if (name === "fullName") {
      // solo letras y espacios
      const onlyLetters = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "").slice(0, 50);
      updateFormData({ fullName: onlyLetters });
      return;
    }

    if (name === "address") {
      updateFormData({ address: value, coords: undefined });
    } else if (name === "location") {
      updateFormData({ location: value, coords: undefined });
    } else {
      updateFormData({ [name]: value });
    }
  };

  // ========================
  // 🔹 Validaciones
  // ========================
  const validateAndNext = () => {
    const newErrors: { phone?: string; email?: string; fullName?: string } = {};

    if (!formData.fullName) newErrors.fullName = "El nombre es obligatorio";
    if (!formData.phone || formData.phone.length !== 10)
      newErrors.phone = "El teléfono debe tener 10 dígitos numéricos";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.(com|com\.ar)$/i.test(formData.email))
      newErrors.email = "Ingresa un correo válido (ej: nombre@gmail.com)";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  // ========================
  // 🔹 Geolocalización
  // ========================
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateFormData({
            address: `Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            location: "Ubicación GPS",
            coords: { lat: latitude, lon: longitude },
          });
          setGettingLocation(false);
        },
        () => {
          alert("No se pudo obtener la ubicación.");
          setGettingLocation(false);
        }
      );
    } else {
      alert("La geolocalización no es soportada por este navegador.");
    }
  };

  const resetLocation = () => {
    updateFormData({ address: "", location: "", coords: undefined });
  };

  return (
    <div className="space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Nombre y Apellido</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          maxLength={50}
          className="w-full px-4 py-2 border rounded-lg"
        />
        {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Teléfono</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          maxLength={10}
          className="w-full px-4 py-2 border rounded-lg"
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2 relative">
        <label className="text-sm font-medium text-slate-600">Email</label>
        <input
          type="text"
          name="email"
          value={formData.email}
          onChange={handleChange}
          maxLength={50}
          className="w-full px-4 py-2 border rounded-lg"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        {emailSuggestions.length > 0 && (
          <ul className="absolute bg-white border rounded-md mt-1 w-full shadow">
            {emailSuggestions.map((s) => (
              <li
                key={s}
                onClick={() => {
                  updateFormData({ email: s });
                  setEmailSuggestions([]);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-100"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Dirección</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Localidad */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Localidad</label>
        <select
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="">Seleccioná una localidad</option>
          {localidades.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* GPS */}
      <button
        onClick={handleGetLocation}
        disabled={gettingLocation || !!formData.location || !!formData.address}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <LocationIcon className="w-5 h-5 text-sky-600" />
        {gettingLocation ? "Obteniendo..." : "Obtener Ubicación [Solo rurales]"}
      </button>

      {/* Coordenadas */}
      {formData.coords && (
        <p className="text-sm text-center text-slate-600">
          Coordenadas: {formData.coords.lat.toFixed(4)}, {formData.coords.lon.toFixed(4)}
        </p>
      )}

      {/* Reset ubicación */}
      {(formData.coords || formData.location) && (
        <button
          onClick={resetLocation}
          className="w-full mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          🔄 Resetear ubicación
        </button>
      )}

      {/* Siguiente */}
      <button
        onClick={validateAndNext}
        className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700"
      >
        Siguiente
      </button>
    </div>
  );
};

export default Step1UserInfo;
