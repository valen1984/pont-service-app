import React, { useEffect, useState } from "react";
import type { FormData, ScheduleDay } from "../../types";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const Step5Calendar: React.FC<Props> = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
}) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 🚀 Traer disponibilidad desde el backend
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/schedule");
        const data: ScheduleDay[] = await res.json();
        setSchedule(data);
      } catch (err) {
        console.error("❌ Error cargando turnos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const handleSelectSlot = (day: string, date: string, time: string) => {
    setSelectedDay(date);
    setSelectedTime(time);
    updateFormData({
      appointmentSlot: { day: `${day} (${date})`, time },
    });
  };

  const handleNext = () => {
    if (selectedDay && selectedTime) {
      nextStep();
    } else {
      alert("Por favor, seleccioná un turno disponible.");
    }
  };

  if (loading) {
    return <p className="text-center">Cargando turnos disponibles...</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">📅 Seleccioná tu turno</h2>

      <div className="space-y-4">
        {schedule.map((day) => (
          <div key={day.date} className="border p-3 rounded-lg">
            <p className="font-semibold mb-2">
              {day.day} ({day.date})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {day.slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => handleSelectSlot(day.day, day.date, slot.time)}
                  disabled={!slot.isAvailable}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    !slot.isAvailable
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : selectedDay === day.date && selectedTime === slot.time
                      ? "bg-sky-600 text-white"
                      : "bg-sky-100 text-sky-700 hover:bg-sky-200"
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
          onClick={handleNext}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
        >
          Confirmar Turno
        </button>
      </div>
    </div>
  );
};

export default Step5Calendar;
