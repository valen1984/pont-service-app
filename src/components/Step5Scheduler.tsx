import React, { useEffect, useState } from "react";
import type { FormData, ScheduleDay, TimeSlot } from "../../types";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const Step5Calendar: React.FC<Props> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [busySlots, setBusySlots] = useState<{ day: string; time: string }[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Calcular límite de 48hs
  const now = new Date();
  const minAllowedDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Cargar disponibilidad y turnos ocupados desde backend
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // Ejemplo: tu backend devuelve disponibilidad semanal
        const res = await fetch("/api/schedule");
        const data = await res.json();
        setSchedule(data);
      } catch (error) {
        console.error("❌ Error cargando disponibilidad:", error);
      }
    };

    const fetchBusySlots = async () => {
      try {
        const res = await fetch("/api/busy-slots");
        const data = await res.json();
        setBusySlots(data);
      } catch (error) {
        console.error("❌ Error cargando turnos ocupados:", error);
      }
    };

    fetchSchedule();
    fetchBusySlots();
  }, []);

  const isSlotAvailable = (day: string, time: string) => {
    const slotDate = new Date(day);

    // 1️⃣ Bloquear próximos 2 días
    if (slotDate < minAllowedDate) return false;

    // 2️⃣ Bloquear si coincide con turnos ocupados
    return !busySlots.some((b) => b.day === day && b.time === time);
  };

  const handleSelect = (day: string, time: string) => {
    setSelectedDay(day);
    setSelectedTime(time);
    updateFormData({ appointmentSlot: { day, time } });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">Seleccioná un turno</h2>

      {schedule.map((day) => (
        <div key={day.day} className="p-4 border rounded-lg space-y-2">
          <h3 className="font-semibold text-slate-700">{day.day}</h3>
          <div className="grid grid-cols-3 gap-2">
            {day.slots.map((slot: TimeSlot, idx: number) => {
              const available = isSlotAvailable(day.date, slot.time);

              return (
                <button
                  key={idx}
                  disabled={!available}
                  onClick={() => handleSelect(day.date, slot.time)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedDay === day.date && selectedTime === slot.time
                      ? "bg-sky-600 text-white"
                      : available
                      ? "bg-slate-100 hover:bg-slate-200"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-4 pt-4">
        <button
          onClick={prevStep}
          className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={nextStep}
          disabled={!selectedDay || !selectedTime}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-slate-300 transition-colors"
        >
          Confirmar Turno
        </button>
      </div>
    </div>
  );
};

export default Step5Calendar;
