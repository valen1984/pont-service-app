// SplashScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Snowfall from "react-snowfall";

type SplashProps = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: SplashProps) {
  const [step, setStep] = useState(0);

  const mensajes = [
    "✨ Preparando magia...",
    "📦 Cargando recursos...",
    "🚀 Listo para comenzar..."
  ];

  // Cambiar mensajes cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % mensajes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Llamar a onFinish después de 6 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 6000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Snowfall style={styles.snow} />
      <Text style={styles.text}>{mensajes[step]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001",
    justifyContent: "center",
    alignItems: "center",
  },
  snow: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  text: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
  },
});
