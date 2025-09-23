import React, { useEffect, useState } from "react";
import type { FormData, ScheduleDay } from "../../types";
import Picker from "react-mobile-picker";

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

  const [pickerValue, setPickerValue] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/schedule");
        const data: ScheduleDay[] = await res.json();
        setSchedule(data);

        if (data.length > 0) {
          const firstDay = data[0];
          const firstSlot = firstDay.slots.find((s) => s.isAvailable);
          if (firstSlot) {
            setPickerValue({ date: firstDay.date, time: firstSlot.time });
          }
        }
      } catch (err) {
        console.error("❌ Error cargando agenda:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleConfirm = () => {
    const selectedDay = schedule.find((d) => d.date === pickerValue.date);
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

  if (loading)
    return <p className="text-center text-slate-500">Cargando disponibilidad...</p>;
  if (schedule.length === 0)
    return <p className="text-center text-slate-500">No hay turnos disponibles.</p>;

  // Valores crudos
  const optionGroups = {
    date: schedule.map((d) => d.date),
    time:
      schedule
        .find((d) => d.date === pickerValue.date)?.slots
        .filter((s) => s.isAvailable)
        .map((s) => s.time) || [],
  };

  // Labels formateados
  const labels: Record<string, { dayShort: string; dateFull: string }> = {};
  schedule.forEach((d) => {
    const dateObj = new Date(`${d.date}T00:00:00`);
    labels[d.date] = {
      dayShort: new Intl.DateTimeFormat("es-AR", {
        weekday: "short",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(dateObj),
      dateFull: new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(dateObj),
    };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">Seleccionar Turno</h2>

      <div className="border rounded-lg p-4 bg-white shadow">
        <Picker
          value={pickerValue}
          onChange={setPickerValue}
          optionGroups={optionGroups}
          renderOption={(option, groupKey) => {
            if (groupKey === "date") {
              const label = labels[option];
              return (
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-sky-600">
                    {label.dayShort.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">{label.dateFull}</span>
                </div>
              );
            }
            return <span className="text-base">{option}</span>;
          }}
          className="flex justify-between text-lg font-semibold text-slate-800"
        />
      </div>

      <style>{`
        .rmc-picker-item {
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform-origin: center center;
        }
        .rmc-picker-item-selected {
          transform: perspective(600px) rotateX(0deg) scale(1.1);
          opacity: 1;
          color: #0ea5e9;
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
          onClick={handleConfirm}
          disabled={!pickerValue.date || !pickerValue.time}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:bg-slate-300"
        >
          Confirmar Turno
        </button>
      </div>
    </div>
  );
};

export default Step5Scheduler;
