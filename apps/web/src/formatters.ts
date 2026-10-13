export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {},
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(value));
}

export function formatReportedValue<T>(
  value: T | null,
  format: (value: T) => string,
  missing = 'Not reported',
): string {
  return value === null ? missing : format(value);
}

export function formatWeather(temperature: number | null, descriptions: string[] | null): string {
  const description = descriptions?.[0]?.trim();
  if (temperature === null && !description) return formatReportedValue(null, String);

  return [
    formatReportedValue(temperature, (value) => `${value} °C`),
    formatReportedValue(description || null, String),
  ].join(' · ');
}
