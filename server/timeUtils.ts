/**
 * Time and Timezone utilities for Europe/London
 * Correctly accounts for Daylight Saving Time (GMT in winter, BST [UTC+1] in summer).
 */

export function getLondonNow(): Date {
  return new Date();
}

/**
 * Returns current offset in minutes for Europe/London at given UTC date
 * GMT = 0, BST = 60
 */
export function getLondonOffsetMinutes(date: Date): number {
  // Use Intl.DateTimeFormat to determine the formatted date in Europe/London
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });

  const londonYear = parseInt(map.year, 10);
  const londonMonth = parseInt(map.month, 10) - 1;
  const londonDay = parseInt(map.day, 10);
  const londonHour = parseInt(map.hour, 10);
  const londonMin = parseInt(map.minute, 10);
  const londonSec = parseInt(map.second, 10);

  const asUtc = Date.UTC(londonYear, londonMonth, londonDay, londonHour, londonMin, londonSec);
  const diffMinutes = Math.round((asUtc - date.getTime()) / 60000);
  return diffMinutes;
}

/**
 * Converts a Europe/London local date string ('YYYY-MM-DD') and time ('HH:mm')
 * into an accurate UTC ISO string.
 */
export function londonToUtcIso(dateStr: string, timeStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hourStr, minStr] = timeStr.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // Guess UTC time assuming GMT, then find Europe/London offset
  const testDate = new Date(Date.UTC(year, month, day, hour, minute, 0));
  const offset = getLondonOffsetMinutes(testDate);
  // Subtract offset to get exact UTC instant
  const utcMillis = testDate.getTime() - offset * 60000;
  return new Date(utcMillis).toISOString();
}

/**
 * Converts a UTC Date or ISO string into Europe/London display components
 */
export function utcToLondon(utcDateOrIso: Date | string): {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  displayDate: string; // 'Tuesday 14 October 2026'
  displayTime: string; // '09:30'
  isDst: boolean;
} {
  const date = typeof utcDateOrIso === 'string' ? new Date(utcDateOrIso) : utcDateOrIso;

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isoDateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = isoDateFormatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => (map[p.type] = p.value));
  const dateStr = `${map.year}-${map.month}-${map.day}`;

  const timeParts = timeFormatter.formatToParts(date);
  const tMap: Record<string, string> = {};
  timeParts.forEach((p) => (tMap[p.type] = p.value));
  const timeStr = `${tMap.hour}:${tMap.minute}`;

  // Day of week in London
  const dayNameFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
  });
  const shortDay = dayNameFormatter.format(date);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = dayMap[shortDay] ?? date.getUTCDay();

  const offset = getLondonOffsetMinutes(date);

  return {
    dateStr,
    timeStr,
    dayOfWeek,
    displayDate: dateFormatter.format(date),
    displayTime: timeStr,
    isDst: offset > 0,
  };
}

/**
 * Format minutes into 'Xh Ym' or 'X mins'
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours}h ${rem}m`;
}
