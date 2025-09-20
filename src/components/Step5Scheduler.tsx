import React, { useState, useEffect } from "react";
import { FormData, ScheduleDay } from "../../types";
import { getAvailableSlots } from "../../services/mockApi";
import { sendConfirmationEmail } from "../utils/email";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600"></div>
  </div>
);

const Step5Scheduler: React.FC<Props> = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
}) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      const availableSlots = await getAvailableSlots();
      setSchedule(availableSlots);
      setIsLoading(false);
    };
    fetchSchedule();
  }, []);

  const handleSlotSelect = (day: string, time: string) => {
    updateFormData({ appointmentSlot: { day, time } });
  };

  const isSlotSelected = (day: string, time: string) => {
    return (
      formData.appointmentSlot?.day === day &&
      formData.appointmentSlot?.time === time
    );
  };

  const handleConfirm = async () => {
    if (formData.appointmentSlot) {
      try {
        // 📧 Mail al cliente
        await sendConfirmationEmail({
          recipient: formData.email,
          fullName: formData.fullName,
          appointment: `${formData.appointmentSlot.day} a las ${formData.appointmentSlot.time}`,
          phone: formData.phone,
          address: formData.address,
          location: formData.location,
          coords: formData.coords,
          photos: formData.photoBase64, // 👈 ahora sí
        });

        // 📧 Mail a tu amigo (copia)
        await sendConfirmationEmail({
          recipient: "valen1984@gmail.com",
          fullName: formData.fullName,
          appointment: `${formData.appointmentSlot.day} a las ${formData.appointmentSlot.time}`,
          phone: formData.phone,
          address: formData.address,
          location: formData.location,
          coords: formData.coords,
          photos: formData.photoBase64, // 👈 ahora sí
        });

        nextStep();
      } catch (error) {
        console.error("❌ Error enviando correos:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-center mb-2">Cargando agenda...</h2>
        <p className="text-center text-slate-500 mb-6">
          Buscando horarios disponibles.
        </p>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-center text-slate-600">
        Selecciona un día y horario para tu servicio.
      </p>
      <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar">
        {schedule.map((day) => (
          <div key={day.date}>
            <h3 className="font-bold text-slate-700">
              {day.day}, {day.date}
            </h3>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {day.slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => handleSlotSelect(day.date, slot.time)}
                  disabled={!slot.isAvailable}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isSlotSelected(day.date, slot.time)
                      ? "bg-sky-600 text-white"
                      : slot.isAvailable
                      ? "bg-slate-100 hover:bg-sky-100 text-slate-800"
                      : "bg-slate-50 text-slate-400 cursor-not-allowed"
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
          onClick={handleConfirm}
          disabled={!formData.appointmentSlot}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-slate-300 transition-colors"
        >
          Confirmar y Pagar
        </button>
      </div>
    </div>
  );
};

export default Step5Scheduler;
