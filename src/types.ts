export enum ServiceType {
  NEW_INSTALLATION = 'Hogar - Instalación split [sin materiales]',
  COMERCIAL_DIAGNOSIS = 'Equipos Comerciales - Diagnostico AC',
  AUTOMOTIVE_PREVENTATIVE = 'Automotriz - Mantenimiento preventivo AC',
  HOME_DIAGNOSIS = 'Hogar - Diagnostico AC',
  AUTOMOTIVE_DIAGNOSIS = 'Automotriz - Diagnóstico AC',
  HOME_SERVICE = 'Hogar - Mantenimiento preventivo split',
  AUTOMOTIVE_MULTIPLE = 'Automotriz - Reparaciones varias AC [A convenir presencialmente]',
  HOME_REFILL = 'Hogar - Carga completa gas refrigerante',
}

export interface FormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  serviceType: ServiceType | '';
  brand: string;
  model: string;
  photos: string[];
  appointmentSlot: { day: string; date?: string; time: string } | null;

  // 👇 Nuevo: coordenadas para GPS o localidades fijas
  coords?: {
    lat: number;
    lon: number;
  };
}

export interface Quote {
  location: string;
  baseCost: number;

  // 👇 Antes era solo number, ahora puede ser string ("Bonificado")
  travelCost: number | string;

  subtotal: number;
  iva: number;
  total: number;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  reason?: 'within48h' | 'busy'; // 👈 nuevo campo opcional
}

export interface ScheduleDay {
  day: string;
  date: string;
  slots: TimeSlot[];
}
