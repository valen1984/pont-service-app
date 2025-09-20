
export enum ServiceType {
  NEW_INSTALLATION = 'Instalación nueva',
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
  appointmentSlot: { day: string; time: string } | null;
}

export interface Quote {
  location: string;
  baseCost: number;
  travelCost: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

export interface ScheduleDay {
  day: string;
  date: string;
  slots: TimeSlot[];
}
