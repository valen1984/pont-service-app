import { ServiceType } from "./types";

// ====================================================================
// CONFIGURACIÓN DE PRECIOS Y COSTOS
// ====================================================================

export const SERVICE_BASE_PRICES: Record<ServiceType, number> = {
  [ServiceType.NEW_INSTALLATION]: 150000,
  [ServiceType.HIGH_ALTITUDE_INSTALLATION]: 150000,
  [ServiceType.AUTOMOTIVE_INSTALLATION]: 4000,
  [ServiceType.HOME_DIAGNOSIS]: 25000,
  [ServiceType.AUTOMOTIVE_DIAGNOSIS]: 25000,
  [ServiceType.HOME_SERVICE]: 90000,
  [ServiceType.AUTOMOTIVE_SERVICE]: 25000,
};

export const COST_PER_KM = 50; // Precio en ARS por km
export const IVA_RATE = 0.21; // 21%

// Opciones visibles en el selector
export const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: ServiceType.NEW_INSTALLATION, label: "Instalación hogar" },
  { value: ServiceType.HIGH_ALTITUDE_INSTALLATION, label: "Instalación en altura" },
  { value: ServiceType.AUTOMOTIVE_INSTALLATION, label: "Instalación automotriz" },
  { value: ServiceType.HOME_DIAGNOSIS, label: "Diagnóstico hogar" },
  { value: ServiceType.AUTOMOTIVE_DIAGNOSIS, label: "Diagnóstico automotriz" },
  { value: ServiceType.HOME_SERVICE, label: "Service hogar" },
  { value: ServiceType.AUTOMOTIVE_SERVICE, label: "Service automotriz" },
];

export const BASE_LOCATION = "General Villegas";

// Pasos del wizard
export const STEPS = [
  "Información de contacto",
  "Servicio",
  "Equipo",
  "Presupuesto",
  "Calendario",
  "Pago",
];

// ====================================================================
// UTILIDADES DE FORMATEO
// ====================================================================

/**
 * Devuelve el texto para el costo de traslado.
 * Si el costo es 0 => 💵 Bonificado
 * Si no => lo devuelve como string con formato $ARS.
 */
export const formatTravelCost = (cost: number): string => {
  if (cost === 0) return "💵 Bonificado";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(cost);
};
