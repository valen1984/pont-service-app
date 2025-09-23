
import React from 'react';
import { FormData, ServiceType } from '../../types';
import { SERVICE_OPTIONS } from '../../server/constants.js';

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const Step2ServiceType: React.FC<Props> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ serviceType: e.target.value as ServiceType });
  };

  return (
    <div className="space-y-8">
        <div className="space-y-2">
            <label htmlFor="serviceType" className="text-sm font-medium text-slate-600">Tipo de servicio</label>
            <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 appearance-none"
            >
                <option value="" disabled>Selecciona un servicio...</option>
                {SERVICE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>

        <div className="flex gap-4">
            <button onClick={prevStep} className="w-full px-4 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                Anterior
            </button>
            <button onClick={nextStep} disabled={!formData.serviceType} className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-slate-300 transition-colors">
                Siguiente
            </button>
        </div>
    </div>
  );
};

export default Step2ServiceType;
