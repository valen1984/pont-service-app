# 🧾 Flujo de Órdenes y Estados – Pont Climatización

Este documento explica la arquitectura actual para el manejo de órdenes, pagos y notificaciones por correo.

---

## 📌 Estructura de archivos principales

/server
├─ constants.js # Estados centralizados (MP + manuales + fallback)
├─ statusMapper.js # Normalizador de estados → { code, label }
├─ email.js # Envío de emails dinámicos con SendGrid
├─ routes/
│ └─ orders.ts # Endpoint principal para actualización de órdenes
└─ ...


---

## 🔄 Flujo de una orden

1. **Cliente genera una orden**  
   - Puede ser con Mercado Pago o manual (pago en domicilio / taller).
   - El frontend envía el estado inicial al backend (`approved`, `pending`, `CONFIRMADA`, `domicilio`, etc.).

2. **Normalización de estado**  
   - En `orders.ts` se llama a `mapStatus(order.status)`.
   - `statusMapper.js` convierte cualquier string en un objeto `{ code, label }` definido en `constants.js`.

   Ejemplo:
   ```js
   mapStatus("CONFIRMADA");
   // 👉 { code: "approved", label: "✅ Pago aprobado - orden CONFIRMADA" }



