export function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatWeather(temperature: number | null, descriptions: string[] | null): string {
  const description = descriptions?.[0]?.trim();
  if (temperature === null && !description) return 'Not reported';

  return [
    temperature === null ? 'Not reported' : `${temperature} °C`,
    description || 'Not reported',
  ].join(' · ');
}
