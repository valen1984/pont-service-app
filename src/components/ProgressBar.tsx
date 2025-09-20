
import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
    return (
        <div className="flex items-center justify-center mb-8">
            {Array.from({ length: totalSteps }, (_, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                            index + 1 <= currentStep ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                           {index + 1}
                        </div>
                    </div>
                    {index < totalSteps - 1 && (
                        <div className={`flex-auto h-1 transition-colors duration-300 ${
                            index + 1 < currentStep ? 'bg-sky-600' : 'bg-slate-200'
                        }`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default ProgressBar;
