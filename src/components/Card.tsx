
import React from 'react';

interface CardProps {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 mt-4">
      {children}
    </div>
  );
};

export default Card;
