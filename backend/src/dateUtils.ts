import { toZonedTime } from 'date-fns-tz';

export function getNowInTimezone() {
  const timezone = process.env.TIMEZONE ?? 'UTC';
  return toZonedTime(new Date(), timezone);
}
