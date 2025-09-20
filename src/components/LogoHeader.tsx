import React from "react";
import PontLogo from "../assets/pont.png"; // ruta según dónde lo guardes

const LogoHeader: React.FC = () => {
  return (
    <div className="text-center mb-4">
      <div className="flex items-center justify-center">
        <img
          src={PontLogo}
          alt="Pont Logo"
          className="h-48 w-auto object-contain"
        />
      </div>
    </div>
  );
};

export default LogoHeader;
