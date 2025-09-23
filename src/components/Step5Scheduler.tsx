import React, { useEffect, useState } from "react";
import type { FormData, ScheduleDay } from "../../types";
import Picker from "react-mobile-picker"; // 👈 picker estilo iOS

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

  const [pickerValue, setPickerValue] = useState({
    day: "",
    time: "",
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/schedule");
        const data = await res.json();
        setSchedule(data);

        // Valor inicial del picker
        if (data.length > 0) {
          setPickerValue({
            day: data[0].date,
            time: data[0].slots.find((s: any) => s.isAvailable)?.time || "",
          });
        }
      } catch (err) {
        console.error("❌ Error cargando agenda:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleConfirmPicker = () => {
    const selectedDay = schedule.find((d) => d.date === pickerValue.day);
    if (!selectedDay) return;

    updateFormData({
      appointmentSlot: {
        day: selectedDay.day,
        date: selectedDay.date,
        time: pickerValue.time,
      },
    });

    nextStep();
  };

  if (loading) {
    return (
      <p className="text-center text-slate-500">
        Cargando disponibilidad...
      </p>
    );
  }

  if (schedule.length === 0) {
    return (
      <p className="text-center text-slate-500">
        No hay turnos disponibles en este momento.
      </p>
    );
  }

  // Opciones para el picker estilo iPhone
  const pickerOptions = {
    day: schedule.map((d) =>
      new Intl.DateTimeFormat("es-AR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(new Date(`${d.date}T00:00:00`))
    ),
    time:
      schedule.find((d) => d.date === pickerValue.day)?.slots
        .filter((s) => s.isAvailable)
        .map((s) => s.time) || [],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">Seleccionar Turno</h2>

      {/* 📱 Picker estilo iPhone con efecto barrel */}
      <div className="flex justify-center border rounded-lg p-4 bg-white shadow">
        <Picker
          value={pickerValue}
          onChange={setPickerValue}
          optionGroups={pickerOptions}
          className="w-full flex justify-between gap-4 text-lg font-semibold text-slate-800"
        />
      </div>

      {/* Efecto barrel (CSS 3D) */}
      <style>{`
        .rmc-picker-item {
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform-origin: center center;
        }
        .rmc-picker-item-selected {
          transform: perspective(600px) rotateX(0deg) scale(1.1);
          opacity: 1;
          color: #0ea5e9; /* sky-500 */
        }
        .rmc-picker-item-before {
          transform: perspective(600px) rotateX(30deg) scale(0.9);
          opacity: 0.6;
        }
        .rmc-picker-item-after {
          transform: perspective(600px) rotateX(-30deg) scale(0.9);
          opacity: 0.6;
        }
      `}</style>

      <div className="flex gap-4 pt-4">
        <button
          onClick={prevStep}
          className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={handleConfirmPicker}
          disabled={!pickerValue.day || !pickerValue.time}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-300"
        >
          Confirmar Turno
        </button>
      </div>
    </div>
  );
};

export default Step5Scheduler;
