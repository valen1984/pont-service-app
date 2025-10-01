import { ServiceType } from "./types";

// ====================================================================
// CONFIGURACIÓN DE PRECIOS Y COSTOS
// ====================================================================

export const SERVICE_BASE_PRICES: Record<ServiceType, number> = {
  [ServiceType.NEW_INSTALLATION]: 150000,
  [ServiceType.COMERCIAL_DIAGNOSIS]: 20000,
  [ServiceType.AUTOMOTIVE_PREVENTATIVE]: 80000,
  [ServiceType.HOME_DIAGNOSIS]: 20000,
  [ServiceType.AUTOMOTIVE_DIAGNOSIS]: 20000,
  [ServiceType.HOME_SERVICE]: 80000,
  [ServiceType.AUTOMOTIVE_MULTIPLE]: 1,
  [ServiceType.HOME_REFILL]: 95000,
};

export const COST_PER_KM = 50; // Precio en ARS por km
export const IVA_RATE = 0.21; // 21%

// Opciones visibles en el selector
export const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: ServiceType.NEW_INSTALLATION, label: "Hogar - Instalación split [sin materiales]" },
  { value: ServiceType.HOME_SERVICE, label: "Hogar - Mantenimiento preventivo split" },
  { value: ServiceType.HOME_REFILL, label: "Hogar - Carga completa gas refrigerante" },
  { value: ServiceType.HOME_DIAGNOSIS, label: "Hogar - Diagnostico AC" },
  { value: ServiceType.AUTOMOTIVE_PREVENTATIVE, label: "Automotriz - Mantenimiento preventivo AC" },
  { value: ServiceType.AUTOMOTIVE_DIAGNOSIS, label: "Automotriz - Diagnóstico AC" },
  { value: ServiceType.AUTOMOTIVE_MULTIPLE, label: "Automotriz - Reparaciones varias AC [A convenir presencialmente]" },
  { value: ServiceType.COMERCIAL_DIAGNOSIS, label: "Equipos Comerciales - Diagnostico AC" },
];

export const BASE_LOCATION = "General Villegas";

// Pasos del wizard
export const STEPS = [
  "Datos del cliente",
  "Tipo de servicio",
  "Detalles del equipo",
  "Presupuesto",
  "Agenda",
  "Pago",
  "Confirmación",
  "Error de pago",
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
