const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfLocalDay(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(value, days) {
  const date = startOfLocalDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function daysBetween(from, to) {
  return Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / DAY_MS);
}

export function formatDday(deadline, now = new Date()) {
  const days = daysBetween(now, deadline);
  if (days < 0) return "기한 종료";
  if (days === 0) return "D-Day";
  return `D-${days}`;
}

export function buildScenarioDates(dateOffsets, now = new Date()) {
  const today = startOfLocalDay(now);
  const occurred = addDays(today, -dateOffsets.occurredDaysAgo);
  const ended = addDays(occurred, dateOffsets.durationDays ?? 1);
  const deadline = addDays(today, dateOffsets.deadlineDaysFromNow);

  return {
    occurredAt: `${formatDate(occurred)} ${dateOffsets.startTime ?? "09:00"}`,
    endedAt: formatDate(ended),
    reportDeadline: formatDate(deadline),
    reportDday: formatDday(deadline, today),
  };
}

export function formatNextPayment(dueDays, now = new Date()) {
  return formatDate(addDays(now, dueDays));
}
