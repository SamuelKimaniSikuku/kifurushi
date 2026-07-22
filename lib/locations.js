// Cities offered in the location dropdowns, grouped by country.
// Add or remove cities freely — the dropdowns update automatically.
export const CITY_GROUPS = [
  {
    country: 'Kenya',
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru', 'Thika', 'Nyeri', 'Kakamega', 'Kitale', 'Malindi'],
  },
  { country: 'Germany', cities: ['Berlin', 'Frankfurt', 'Munich', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf'] },
  { country: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh'] },
  { country: 'Netherlands', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'] },
  { country: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Lille', 'Toulouse'] },
  { country: 'Belgium', cities: ['Brussels', 'Antwerp', 'Ghent', 'Liège'] },
  { country: 'Italy', cities: ['Milan', 'Rome', 'Turin', 'Bologna', 'Florence'] },
  { country: 'Sweden', cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'] },
  { country: 'Denmark', cities: ['Copenhagen', 'Aarhus', 'Odense'] },
  { country: 'Norway', cities: ['Oslo', 'Bergen', 'Trondheim'] },
  { country: 'Finland', cities: ['Helsinki', 'Tampere'] },
  { country: 'Ireland', cities: ['Dublin', 'Cork', 'Galway'] },
  { country: 'Switzerland', cities: ['Zurich', 'Geneva', 'Basel', 'Bern'] },
  { country: 'Austria', cities: ['Vienna', 'Graz'] },
  { country: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia'] },
  { country: 'Portugal', cities: ['Lisbon', 'Porto'] },
  { country: 'Poland', cities: ['Warsaw', 'Kraków'] },
];

// Value encoding used by the dropdowns: "City|Country"
export const OTHER_VALUE = '__other__';

export function splitCityValue(value) {
  if (!value || value === OTHER_VALUE) return { city: '', country: '' };
  const [city, country] = value.split('|');
  return { city: city || '', country: country || '' };
}
