import React, { useState } from "react";
import type { FormData } from "../types";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
}

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

const Step1UserInfo: React.FC<Props> = ({ formData, updateFormData, nextStep }) => {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const commonDomains = ["gmail.com", "hotmail.com", "icloud.com"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      updateFormData({ phone: digits });
    } else if (name === "fullName") {
      updateFormData({ fullName: value.slice(0, 20) });
    } else if (name === "address") {
      updateFormData({ address: value.slice(0, 20), coords: undefined });
    } else if (name === "location") {
      updateFormData({ location: value, coords: undefined, locationFromGPS: false });
    } else if (name === "email") {
      updateFormData({ email: value });
      setShowSuggestions(!value.includes("@"));
    } else {
      updateFormData({ [name]: value });
    }
  };

  const handleSuggestionClick = (domain: string) => {
    const base = formData.email.split("@")[0];
    const newEmail = `${base}@${domain}`;
    updateFormData({ email: newEmail });
    setShowSuggestions(false);
  };

  const getAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();

      const street = data.address.road || "";
      const number = data.address.house_number || "";
      const address = [street, number].filter(Boolean).join(" ");

      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.hamlet ||
        "";

      return {
        address:
          address ||
          data.display_name ||
          `Coordenadas: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        city,
      };
    } catch {
      return {
        address: `Coordenadas: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        city: "",
      };
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const { address, city } = await getAddressFromCoords(latitude, longitude);

          updateFormData({
            address: address.slice(0, 20),
            location: city || "Ubicación GPS",
            coords: { lat: latitude, lon: longitude },
            locationFromGPS: true,
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
    updateFormData({ address: "", location: "", coords: undefined, locationFromGPS: false });
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid = () =>
    formData.fullName.length > 0 &&
    formData.phone.length === 10 &&
    isValidEmail(formData.email) &&
    formData.address.length > 0 &&
    formData.location;

  return (
    <div className="space-y-6">
      {/* Nombre */}
      <input
        type="text"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="Nombre y Apellido"
        maxLength={20}
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Teléfono */}
      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Teléfono (10 dígitos)"
        maxLength={10}
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Email */}
      <div className="relative">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={() => setEmailTouched(true)}
          placeholder="tuemail@ejemplo.com"
          className="w-full px-4 py-2 border rounded-lg"
        />
        {showSuggestions && (
          <ul className="absolute bg-white border rounded-lg mt-1 w-full z-10">
            {commonDomains.map((domain) => (
              <li
                key={domain}
                onClick={() => handleSuggestionClick(domain)}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
              >
                {formData.email.split("@")[0]}@{domain}
              </li>
            ))}
          </ul>
        )}
        {emailTouched && formData.email.length > 0 && !isValidEmail(formData.email) && (
          <p className="text-sm text-red-500">El correo electrónico no es válido</p>
        )}
      </div>

      {/* Dirección */}
      <input
        type="text"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Calle y número o Ruta y Km"
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Localidad */}
      <select
        name="location"
        value={formData.location}
        onChange={handleChange}
        disabled={!!formData.locationFromGPS}
        className="w-full px-4 py-2 border rounded-lg"
      >
        <option value="">Seleccioná una localidad</option>
        {localidades.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>

      {/* Botón GPS */}
      <button
        onClick={handleGetLocation}
        disabled={gettingLocation}
        className="w-full px-4 py-2 border rounded-lg"
      >
        {gettingLocation ? "Obteniendo..." : "Obtener Ubicación"}
      </button>

      {/* Coordenadas */}
      {formData.coords && (
        <p className="text-sm text-center text-slate-600">
          Coordenadas: {formData.coords.lat.toFixed(4)}, {formData.coords.lon.toFixed(4)}
        </p>
      )}

      {/* Reset ubicación */}
      {(formData.coords || formData.locationFromGPS) && (
        <button
          onClick={resetLocation}
          className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg"
        >
          🔄 Resetear ubicación
        </button>
      )}

      {/* Siguiente */}
      <button
        onClick={nextStep}
        disabled={!isFormValid()}
        className="w-full px-4 py-3 bg-sky-600 text-white rounded-lg"
      >
        Siguiente
      </button>
    </div>
  );
};

export default Step1UserInfo;
