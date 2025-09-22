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

    if (name === "phone") {
      // Solo números, máximo 10 dígitos
      const digits = value.replace(/\D/g, "").slice(0, 10);
      updateFormData({ phone: digits });
    } else if (name === "fullName") {
      updateFormData({ fullName: value.slice(0, 20) });
    } else if (name === "address") {
      updateFormData({
        address: value.slice(0, 20), // limitar dirección
        coords: undefined,
      });
    } else if (name === "location") {
      updateFormData({
        location: value,
        coords: undefined,
      });
    } else {
      updateFormData({ [name]: value });
    }
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
        data.address.suburb ||
        data.address.neighbourhood ||
        data.address.municipality ||
        data.address.county ||
        data.address.state_district ||
        "";

      return {
        address:
          address ||
          data.display_name ||
          `Coordenadas: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        city,
      };
    } catch (error) {
      console.error("Error obteniendo dirección:", error);
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
          const { address, city } = await getAddressFromCoords(
            latitude,
            longitude
          );

          updateFormData({
            address: address.slice(0, 20),
            location: city || "Ubicación GPS",
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
    updateFormData({
      address: "",
      location: "",
      coords: undefined,
    });
  };

  const isFormValid = () => {
    return (
      formData.fullName.length > 0 &&
      formData.fullName.length <= 20 &&
      formData.phone.length === 10 &&
      formData.email.length > 0 &&
      formData.email.length <= 25 &&
      formData.address.length > 0 &&
      formData.address.length <= 20 &&
      formData.location
    );
  };

  return (
    <div className="space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-slate-600">
          Nombre y Apellido
        </label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          value={formData.fullName}
          onChange={handleChange}
          maxLength={20}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
          required
        />
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-slate-600">
          Teléfono
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          maxLength={10}
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
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium text-slate-600">
          Dirección
        </label>
        <input
          type="text"
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
          maxLength={20}
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

      {/* Botón GPS */}
      <button
        onClick={handleGetLocation}
        disabled={gettingLocation || !!formData.location || !!formData.address}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
      >
        <LocationIcon className="w-5 h-5 text-sky-600" />
        {gettingLocation
          ? "Obteniendo..."
          : "Obtener Ubicación [Solo establecimientos rurales]"}
      </button>

      {/* Coordenadas */}
      {formData.coords && (
        <p className="text-sm text-center text-slate-600">
          Coordenadas: {formData.coords.lat.toFixed(4)},{" "}
          {formData.coords.lon.toFixed(4)}
        </p>
      )}

      {/* Botón reset ubicación */}
      {(formData.coords || formData.location) && (
        <button
          onClick={resetLocation}
          className="w-full mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          🔄 Resetear ubicación
        </button>
      )}

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
