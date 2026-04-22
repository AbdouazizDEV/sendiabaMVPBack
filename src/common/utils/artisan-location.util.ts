const CITY_COUNTRY: Record<string, string> = {
  Dakar: 'Sénégal',
  'Ngaye Mékhé': 'Sénégal',
  'Saint-Louis': 'Sénégal',
  Thiès: 'Sénégal',
  Bamako: 'Mali',
  'Ségou': 'Mali',
  Abidjan: "Côte d'Ivoire",
};

export function formatArtisanLocation(city: string): string {
  const country = CITY_COUNTRY[city] ?? 'Afrique';
  return `${city}, ${country}`;
}
