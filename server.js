// ======================
// 📌 Agenda con Google Calendar
// ======================
async function generateSchedule() {
  const today = new Date();
  const result = [];

  try {
    const eventsRes = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: today.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsRes.data.items || [];
    const busySlotsFromCalendar = [];

    for (const ev of events) {
      const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start?.date);
      const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : new Date(ev.end?.date);
      if (!start || !end) continue;

      const yyyy = start.getFullYear();
      const mm = String(start.getMonth() + 1).padStart(2, "0");
      const dd = String(start.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      for (let hour = 9; hour < 17; hour += 2) {
        const slotDateTime = new Date(`${formattedDate}T${hour.toString().padStart(2, "0")}:00`);
        if (slotDateTime >= start && slotDateTime < end) {
          busySlotsFromCalendar.push({
            date: formattedDate,
            time: slotDateTime.toTimeString().slice(0, 5),
          });
        }
      }
    }

    const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // lunes a sábado
    const START_HOUR = 9;
    const END_HOUR = 17;
    const INTERVAL = 2;

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // ✅ Forzar timezone Argentina
      const localDate = new Date(
        date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
      );
      const dayOfWeek = localDate.getDay();

      if (!WORKING_DAYS.includes(dayOfWeek)) continue; // Excluye domingos

      const yyyy = localDate.getFullYear();
      const mm = String(localDate.getMonth() + 1).padStart(2, "0");
      const dd = String(localDate.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const slots = [];
      for (let hour = START_HOUR; hour < END_HOUR; hour += INTERVAL) {
        const slotTime = `${hour.toString().padStart(2, "0")}:00`;

        const slotDateTime = new Date(`${formattedDate}T${slotTime}:00`);
        const now = new Date();
        const diffMs = slotDateTime.getTime() - now.getTime();

        const within48h = diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;
        const isBusy = busySlotsFromCalendar.some(
          (s) => s.date === formattedDate && s.time === slotTime
        );

        slots.push({
          time: slotTime,
          isAvailable: !within48h && !isBusy,
          reason: within48h ? "within48h" : isBusy ? "busy" : "free",
        });
      }

      result.push({
        day:
          localDate.toLocaleDateString("es-AR", { weekday: "short" }) +
          " " +
          localDate.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
        date: formattedDate,
        slots,
      });
    }
  } catch (err) {
    console.error("❌ Error al generar agenda desde Google Calendar:", err);
    throw err;
  }

  return result;
}
