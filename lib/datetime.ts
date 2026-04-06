const ISRAEL_TZ = "Asia/Jerusalem";

export function formatDateIL(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: ISRAEL_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTimeIL(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: ISRAEL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateTimeIL(date: Date) {
  return `${formatDateIL(date)} ${formatTimeIL(date)}`;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") values[p.type] = p.value;
  }

  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUTC - date.getTime();
}

export function jerusalemLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(utcGuess, ISRAEL_TZ);
  return new Date(utcGuess.getTime() - offset);
}

function getJerusalemParts(date: Date) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISRAEL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") values[p.type] = p.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: values.weekday, // Mon, Tue...
  };
}

export function getJerusalemWeekRange(referenceDate = new Date()) {
  const parts = getJerusalemParts(referenceDate);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };

  const dayOffset = map[parts.weekday] ?? 0;
  const refAtMidnightUtc = jerusalemLocalToUtc(parts.year, parts.month, parts.day);
  const start = new Date(refAtMidnightUtc.getTime() - dayOffset * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

export function getJerusalemDateInputValue(referenceDate = new Date()) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(referenceDate);
}

