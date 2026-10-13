type DateFormatOptions = {
  dateOnly?: boolean;
  locale?: string;
  timeZone?: string;
};

export function formatDate(value: string, options: DateFormatOptions = {}): string {
  return new Intl.DateTimeFormat(options.locale, {
    dateStyle: 'medium',
    timeStyle: options.dateOnly ? undefined : 'short',
    timeZone: options.timeZone,
  }).format(new Date(value));
}

export function formatReportedValue<T>(
  value: T | null,
  format: (value: T) => string,
  missing = 'Not reported',
): string {
  return value === null ? missing : format(value);
}

export function formatTemperature(value: number | null): string {
  return formatReportedValue(value, (temperature) => `${temperature} °C`);
}

export function formatWeather(temperature: number | null, descriptions: string[] | null): string {
  const description = descriptions?.[0]?.trim();
  if (temperature === null && !description) return formatReportedValue(null, String);

  return [formatTemperature(temperature), formatReportedValue(description || null, String)].join(
    ' · ',
  );
}
