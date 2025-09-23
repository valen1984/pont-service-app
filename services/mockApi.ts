import { FormData, Quote, ScheduleDay } from "../src/types.ts";
import { SERVICE_BASE_PRICES, IVA_RATE } from "../server/constants.js";

// =========================
// CONFIG
// =========================

// Base en General Villegas
export const HQ = { lat: -35.0311, lon: -63.0235 };

// Km bonificados
const FREE_KM = 5;

// Tarifa fija por km adicional
const COST_PER_KM = 2000;

// Coordenadas fijas de localidades
const FIXED_COORDS: Record<string, { lat: number; lon: number }> = {
  "General Villegas": { lat: -35.0311, lon: -63.0235 },
  "Piedritas": { lat: -35.2400, lon: -62.9500 },
  "Cañada Seca": { lat: -34.9833, lon: -63.2333 },
  "Emilio V. Bunge": { lat: -34.9500, lon: -62.8167 },
  "Coronel Charlone": { lat: -34.9167, lon: -62.7333 },
  "Santa Regina": { lat: -34.8667, lon: -62.9667 },
  "Villa Sauze": { lat: -34.7333, lon: -63.2833 },
  "Elordi": { lat: -35.0500, lon: -63.4167 },
  "Ameghino": { lat: -34.8000, lon: -62.9000 },
  "Carlos Tejedor": { lat: -35.4000, lon: -62.4167 },
  "Trenque Lauquen": { lat: -35.9667, lon: -62.7333 },
  "America (Rivadavia)": { lat: -35.4833, lon: -62.9667 },
  "Eduardo Castex": { lat: -35.9167, lon: -64.3000 },
  "General Pico": { lat: -35.6667, lon: -63.7500 },
  "Intendente Alvear": { lat: -35.2333, lon: -63.5833 },
  "Villa Huidobro": { lat: -34.8333, lon: -64.5833 },
  "Rufino": { lat: -34.2667, lon: -62.7167 },
};

// =========================
// Cálculo de traslado
// =========================
async function computeTravelCost(formData: FormData): Promise<number | string> {
  let coords = formData.coords ?? null;

  // 👇 Si seleccionó una localidad conocida, usamos la coordenada fija
  if (formData.location && FIXED_COORDS[formData.location]) {
    coords = FIXED_COORDS[formData.location];
  }

  // 👇 Si sigue sin coords, probamos con geocode online
  if (!coords) {
    coords = await forwardGeocode(formData.address, formData.location);
  }

  // Si no hay coordenadas (ni fijas ni GPS ni geocode), devolvemos 0
  if (!coords) return 0;

  const km = haversineKm(HQ.lat, HQ.lon, coords.lat, coords.lon);

  if (km <= FREE_KM) {
    return "💵 Bonificado";
  }

  const extraKm = Math.max(0, km - FREE_KM);
  return Math.round(extraKm * COST_PER_KM);
}

// =========================
// UTILS
// =========================

// Distancia Haversine en km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Geocoding a coordenadas (OpenStreetMap)
async function forwardGeocode(address?: string, location?: string) {
  try {
    const query = encodeURIComponent(`${address || ""}, ${location || ""}`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error("Error en forwardGeocode:", err);
  }
  return null;
}

// =========================
// Cotización
// =========================
export const calculateQuote = async (formData: FormData): Promise<Quote> => {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      const baseCost = formData.serviceType ? SERVICE_BASE_PRICES[formData.serviceType] : 0;

      const travelCost = await computeTravelCost(formData);

      // Si es string ("Bonificado"), no lo sumamos
      const numericTravelCost = typeof travelCost === "number" ? travelCost : 0;

      const subtotal = baseCost + numericTravelCost;
      const iva = subtotal * IVA_RATE;
      const total = subtotal + iva;

      resolve({
        location: formData.location || "General Villegas, Buenos Aires",
        baseCost,
        travelCost, // puede ser number o "Bonificado"
        subtotal,
        iva,
        total,
      });
    }, 1000);
  });
};

// =========================
// Agenda mock
// =========================
export const getAvailableSlots = async (): Promise<ScheduleDay[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const schedule: ScheduleDay[] = [];
      const today = new Date();

      // 👇 Incluimos DOM para que el índice de getDay() no desplace el resto
      const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
      const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        const dayName = days[currentDate.getDay()];
        const dateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

        if (dayName === "DOM") continue; // seguimos saltando domingos

        schedule.push({
          day: dayName,
          date: currentDate.toLocaleDateString("es-AR"),
          slots: times.map((time) => ({
            time,
            isAvailable: Math.random() > 0.3,
          })),
        });
      }
      resolve(schedule);
    }, 500);
  });
};

// =========================
// Pago simulado
// =========================
export const processPayment = async (quote: Quote): Promise<boolean> => {
  console.log(`Iniciando pago por ${quote.total}...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccess = Math.random() < 0.85;
      resolve(isSuccess);
    }, 2000);
  });
};
