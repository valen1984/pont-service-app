export enum ServiceType {
  NEW_INSTALLATION = 'Instalación hogar',
  HIGH_ALTITUDE_INSTALLATION = 'Instalación en altura',
  AUTOMOTIVE_INSTALLATION = 'Instalación automotriz',
  HOME_DIAGNOSIS = 'Diagnóstico hogar',
  AUTOMOTIVE_DIAGNOSIS = 'Diagnóstico automotriz',
  HOME_SERVICE = 'Service hogar',
  AUTOMOTIVE_SERVICE = 'Service automotriz',
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
