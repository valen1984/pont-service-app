import { ServiceType } from './types';

// ====================================================================
// CONFIGURACIÓN DE PRECIOS Y COSTOS
// Modifica los valores en esta sección para ajustar las tarifas.
// ====================================================================

/**
 * Define el precio base para cada tipo de servicio.
 * Simplemente cambia el número después de los dos puntos (:) para actualizar un precio.
 * Por ejemplo, para cambiar 'Instalación nueva' a $7500, la línea sería:
 * [ServiceType.NEW_INSTALLATION]: 7500,
 */
export const SERVICE_BASE_PRICES: Record<ServiceType, number> = {
  [ServiceType.NEW_INSTALLATION]: 150000,
  [ServiceType.HIGH_ALTITUDE_INSTALLATION]: 150000,
  [ServiceType.AUTOMOTIVE_INSTALLATION]: 4000,
  [ServiceType.HOME_DIAGNOSIS]: 25000,
  [ServiceType.AUTOMOTIVE_DIAGNOSIS]: 25000,
  [ServiceType.HOME_SERVICE]: 90000,
  [ServiceType.AUTOMOTIVE_SERVICE]: 25000,
};

/**
 * Costo por kilómetro para calcular el gasto de traslado.
 * Cambia este valor para ajustar la tarifa de viaje.
 */
export const COST_PER_KM = 50; // Precio en ARS por km

/**
 * Tasa de IVA. Generalmente no es necesario cambiar esto.
 * 0.21 representa el 21%.
 */
export const IVA_RATE = 0.21;

// ====================================================================
// CONFIGURACIÓN GENERAL DE LA APLICACIÓN
// ====================================================================

export const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: ServiceType.NEW_INSTALLATION, label: 'Instalación hogar' },
  { value: ServiceType.HIGH_ALTITUDE_INSTALLATION, label: 'Instalación en altura' },
  { value: ServiceType.AUTOMOTIVE_INSTALLATION, label: 'Instalación automotriz' },
  { value: ServiceType.HOME_DIAGNOSIS, label: 'Diagnóstico hogar' },
  { value: ServiceType.AUTOMOTIVE_DIAGNOSIS, label: 'Diagnóstico automotriz' },
  { value: ServiceType.HOME_SERVICE, label: 'Service hogar' },
  { value: ServiceType.AUTOMOTIVE_SERVICE, label: 'Service automotriz' },
];


export const BASE_LOCATION = 'General Villegas';
export const TECHNICIAN_EMAIL = 'tecnico@example.com'; // Email del técnico para reportes y presupuestos.

export const STEPS = [
    "Información de contacto",
    "Servicio",
    "Equipo",
    "Presupuesto",
    "Calendario",
    "Pago"
];
