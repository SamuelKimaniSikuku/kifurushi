// All 54 African countries + major diaspora destinations abroad.
export type Region =
  | "North Africa"
  | "West Africa"
  | "East Africa"
  | "Central Africa"
  | "Southern Africa"
  | "Europe"
  | "North America"
  | "Middle East"
  | "Asia-Pacific";

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  region: Region;
  africa: boolean;
}

const c = (
  code: string,
  name: string,
  flag: string,
  region: Region,
  africa = true
): Country => ({ code, name, flag, region, africa });

export const AFRICAN_COUNTRIES: Country[] = [
  // North Africa
  c("DZ", "Algeria", "🇩🇿", "North Africa"),
  c("EG", "Egypt", "🇪🇬", "North Africa"),
  c("LY", "Libya", "🇱🇾", "North Africa"),
  c("MA", "Morocco", "🇲🇦", "North Africa"),
  c("SD", "Sudan", "🇸🇩", "North Africa"),
  c("TN", "Tunisia", "🇹🇳", "North Africa"),
  // West Africa
  c("BJ", "Benin", "🇧🇯", "West Africa"),
  c("BF", "Burkina Faso", "🇧🇫", "West Africa"),
  c("CV", "Cabo Verde", "🇨🇻", "West Africa"),
  c("CI", "Côte d'Ivoire", "🇨🇮", "West Africa"),
  c("GM", "Gambia", "🇬🇲", "West Africa"),
  c("GH", "Ghana", "🇬🇭", "West Africa"),
  c("GN", "Guinea", "🇬🇳", "West Africa"),
  c("GW", "Guinea-Bissau", "🇬🇼", "West Africa"),
  c("LR", "Liberia", "🇱🇷", "West Africa"),
  c("ML", "Mali", "🇲🇱", "West Africa"),
  c("MR", "Mauritania", "🇲🇷", "West Africa"),
  c("NE", "Niger", "🇳🇪", "West Africa"),
  c("NG", "Nigeria", "🇳🇬", "West Africa"),
  c("SN", "Senegal", "🇸🇳", "West Africa"),
  c("SL", "Sierra Leone", "🇸🇱", "West Africa"),
  c("TG", "Togo", "🇹🇬", "West Africa"),
  // East Africa
  c("BI", "Burundi", "🇧🇮", "East Africa"),
  c("KM", "Comoros", "🇰🇲", "East Africa"),
  c("DJ", "Djibouti", "🇩🇯", "East Africa"),
  c("ER", "Eritrea", "🇪🇷", "East Africa"),
  c("ET", "Ethiopia", "🇪🇹", "East Africa"),
  c("KE", "Kenya", "🇰🇪", "East Africa"),
  c("MG", "Madagascar", "🇲🇬", "East Africa"),
  c("MW", "Malawi", "🇲🇼", "East Africa"),
  c("MU", "Mauritius", "🇲🇺", "East Africa"),
  c("RW", "Rwanda", "🇷🇼", "East Africa"),
  c("SC", "Seychelles", "🇸🇨", "East Africa"),
  c("SO", "Somalia", "🇸🇴", "East Africa"),
  c("SS", "South Sudan", "🇸🇸", "East Africa"),
  c("TZ", "Tanzania", "🇹🇿", "East Africa"),
  c("UG", "Uganda", "🇺🇬", "East Africa"),
  c("ZM", "Zambia", "🇿🇲", "East Africa"),
  c("ZW", "Zimbabwe", "🇿🇼", "East Africa"),
  // Central Africa
  c("AO", "Angola", "🇦🇴", "Central Africa"),
  c("CM", "Cameroon", "🇨🇲", "Central Africa"),
  c("CF", "Central African Republic", "🇨🇫", "Central Africa"),
  c("TD", "Chad", "🇹🇩", "Central Africa"),
  c("CG", "Congo (Brazzaville)", "🇨🇬", "Central Africa"),
  c("CD", "DR Congo", "🇨🇩", "Central Africa"),
  c("GQ", "Equatorial Guinea", "🇬🇶", "Central Africa"),
  c("GA", "Gabon", "🇬🇦", "Central Africa"),
  c("ST", "São Tomé & Príncipe", "🇸🇹", "Central Africa"),
  // Southern Africa
  c("BW", "Botswana", "🇧🇼", "Southern Africa"),
  c("SZ", "Eswatini", "🇸🇿", "Southern Africa"),
  c("LS", "Lesotho", "🇱🇸", "Southern Africa"),
  c("MZ", "Mozambique", "🇲🇿", "Southern Africa"),
  c("NA", "Namibia", "🇳🇦", "Southern Africa"),
  c("ZA", "South Africa", "🇿🇦", "Southern Africa"),
];

export const DIASPORA_COUNTRIES: Country[] = [
  c("GB", "United Kingdom", "🇬🇧", "Europe", false),
  c("FR", "France", "🇫🇷", "Europe", false),
  c("DE", "Germany", "🇩🇪", "Europe", false),
  c("NL", "Netherlands", "🇳🇱", "Europe", false),
  c("BE", "Belgium", "🇧🇪", "Europe", false),
  c("IT", "Italy", "🇮🇹", "Europe", false),
  c("ES", "Spain", "🇪🇸", "Europe", false),
  c("PT", "Portugal", "🇵🇹", "Europe", false),
  c("SE", "Sweden", "🇸🇪", "Europe", false),
  c("NO", "Norway", "🇳🇴", "Europe", false),
  c("DK", "Denmark", "🇩🇰", "Europe", false),
  c("CH", "Switzerland", "🇨🇭", "Europe", false),
  c("IE", "Ireland", "🇮🇪", "Europe", false),
  c("US", "United States", "🇺🇸", "North America", false),
  c("CA", "Canada", "🇨🇦", "North America", false),
  c("AE", "United Arab Emirates", "🇦🇪", "Middle East", false),
  c("SA", "Saudi Arabia", "🇸🇦", "Middle East", false),
  c("QA", "Qatar", "🇶🇦", "Middle East", false),
  c("TR", "Turkey", "🇹🇷", "Middle East", false),
  c("CN", "China", "🇨🇳", "Asia-Pacific", false),
  c("IN", "India", "🇮🇳", "Asia-Pacific", false),
  c("AU", "Australia", "🇦🇺", "Asia-Pacific", false),
];

export const ALL_COUNTRIES: Country[] = [
  ...AFRICAN_COUNTRIES,
  ...DIASPORA_COUNTRIES,
];

export const byCode = (code: string): Country | undefined =>
  ALL_COUNTRIES.find((x) => x.code === code);

export const label = (code: string): string => {
  const co = byCode(code);
  return co ? `${co.flag} ${co.name}` : code;
};
