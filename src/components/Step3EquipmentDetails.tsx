import React, { useState } from "react";
import type { FormData } from "../../types";

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
    />
  </svg>
);

const Step3EquipmentDetails: React.FC<Props> = ({
  formData,
  updateFormData,
  nextStep,
  prevStep,
}) => {
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 2); // máx. 2 fotos
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("upload_preset", "ml_default"); // ⚡ tu preset unsigned

        try {
          const res = await fetch(
            "https://api.cloudinary.com/v1_1/dq3gychaz/image/upload", // ⚡ cloud_name va en la URL
            {
              method: "POST",
              body: formDataUpload,
            }
          );

          const data = await res.json();
          if (data.secure_url) {
            uploadedUrls.push(data.secure_url);
          }
        } catch (err) {
          console.error("❌ Error subiendo a Cloudinary:", err);
        }
      }

      // Guardamos solo las URLs en formData
      updateFormData({ photos: uploadedUrls });

      // Usamos las URLs también para preview
      setPhotoPreviews(uploadedUrls);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotoPreviews(newPreviews);

    const newFiles = (formData.photos as string[]).filter((_, i) => i !== index);
    updateFormData({ photos: newFiles });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="brand" className="text-sm font-medium text-slate-600">
          Marca
        </label>
        <input
          type="text"
          name="brand"
          id="brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="model" className="text-sm font-medium text-slate-600">
          Modelo
        </label>
        <input
          type="text"
          name="model"
          id="model"
          value={formData.model}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">
          Adjuntar foto equipo y motor (máx. 2 fotos)
        </label>
        <label
          htmlFor="photos"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <CameraIcon className="w-6 h-6" />
          <span>Elegir hasta 2 archivos o tomar fotos</span>
        </label>
        <input
          type="file"
          name="photos"
          id="photos"
          onChange={handleFileChange}
          multiple
          accept="image/*"
          capture="environment" // 👈 abre cámara en celular
          className="sr-only"
        />
      </div>

      {photoPreviews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photoPreviews.map((src, index) => (
            <div key={index} className="relative">
              <img
                src={src}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          onClick={prevStep}
          className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={nextStep}
          className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
        >
          Calcular Presupuesto
        </button>
      </div>
    </div>
  );
};

export default Step3EquipmentDetails;
