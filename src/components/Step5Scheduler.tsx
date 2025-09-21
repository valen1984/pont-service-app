import React, { useEffect, useState } from "react";
import type { FormData, ScheduleDay } from "../../types";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const Step5Scheduler: React.FC<Props> = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
}) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/schedule"); // ✅ Backend ya devuelve solo días válidos
        const data = await res.json();
        setSchedule(data);
      } catch (err) {
        console.error("❌ Error cargando agenda:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleSelectSlot = (day: ScheduleDay, time: string) => {
    updateFormData({
      appointmentSlot: {
        day: day.day,
        date: day.date,
        time,
      },
    });
  };

  if (loading) {
    return <p className="text-center text-slate-500">Cargando disponibilidad...</p>;
  }

  if (schedule.length === 0) {
    return <p className="text-center text-slate-500">No hay turnos disponibles en este momento.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">Seleccionar Turno</h2>
      <div className="grid gap-4">
        {schedule.map((day) => (
          <div key={day.date} className="p-4 border rounded-lg bg-slate-50">
            <h3 className="font-semibold">
              {day.day} - {day.date}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {day.slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => handleSelectSlot(day, slot.time)}
                  disabled={!slot.isAvailable}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    !slot.isAvailable
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : formData.appointmentSlot?.date === day.date &&
                        formData.appointmentSlot?.time === slot.time
                      ? "bg-sky-600 text-white"
                      : "bg-white border border-slate-300 hover:bg-sky-50"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={prevStep}
          className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={nextStep}
          disabled={!formData.appointmentSlot}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-300"
        >
          Confirmar Turno
        </button>
      </div>
    </div>
  );
};

export default Step5Scheduler;
