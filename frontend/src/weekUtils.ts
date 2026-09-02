import type { Application } from "./types";

export function mostRecentSaturday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  d.setDate(d.getDate() - ((day + 1) % 7));
  return d.toISOString().slice(0, 10);
}

export function isSaturday(weekEndingISODate: string): boolean {
  return new Date(`${weekEndingISODate}T00:00:00`).getDay() === 6;
}

/** Applications with dateApplied in the Sun-Sat week ending on weekEndingISODate, oldest first. */
export function applicationsInWeek(applications: Application[], weekEndingISODate: string): Application[] {
  const ending = new Date(`${weekEndingISODate}T00:00:00`);
  const start = new Date(ending);
  start.setDate(start.getDate() - 6);

  return applications
    .filter((a) => {
      const d = new Date(`${a.dateApplied.slice(0, 10)}T00:00:00`);
      return d >= start && d <= ending;
    })
    .sort((a, b) => a.dateApplied.localeCompare(b.dateApplied));
}

export function twcPdfBaseName(weekEndingISODate: string): string {
  const ending = new Date(`${weekEndingISODate}T00:00:00`);
  return `work-search-log-twc-ending-${ending.getMonth() + 1}.${ending.getDate()}.${String(ending.getFullYear()).slice(2)}`;
}
