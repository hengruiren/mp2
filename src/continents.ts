import type { Artwork } from './artworks'

export const CONTINENTS = [
  { id: 'asia', label: 'Asia' },
  { id: 'africa', label: 'Africa' },
  { id: 'europe', label: 'Europe' },
  { id: 'north-america', label: 'North America' },
  { id: 'south-america', label: 'South America' },
  { id: 'oceania', label: 'Oceania' },
  { id: 'antarctica', label: 'Antarctica' },
  { id: 'unknown', label: 'Unknown' },
] as const

export type Continent = typeof CONTINENTS[number]['id']

const ORIGINS: Record<Exclude<Continent, 'unknown'>, string[]> = {
  asia: ['Asia', 'China', 'Japan', 'Korea', 'Taiwan', 'Mongolia', 'Vietnam', 'Thailand', 'Cambodia', 'Myanmar', 'Burma', 'Laos', 'Indonesia', 'Malaysia', 'Singapore', 'Philippines', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'Tibet', 'Ladakh', 'Kashmir', 'Himalaya', 'Himalayas', 'Afghanistan', 'Iran', 'Iraq', 'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Kuwait', 'Uzbekistan', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Kyoto', 'Tokyo', 'Beijing', 'Shanghai', 'Tamil Nadu', 'Nagapattinam', 'Rajasthan', 'Udaipur', 'Agra'],
  africa: ['Africa', 'Egypt', 'Nigeria', 'Niger', 'Mali', 'Ghana', 'Benin', 'Togo', 'Congo', 'Democratic Republic of the Congo', 'Zaire', 'Cameroon', 'Gabon', 'Angola', 'Zambia', 'Zimbabwe', 'South Africa', 'Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Burundi', 'Ethiopia', 'Eritrea', 'Somalia', 'Sudan', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Senegal', 'Gambia', 'Guinea Bissau', 'Equatorial Guinea', 'Sierra Leone', 'Liberia', 'Ivory Coast', 'Cote d Ivoire', 'Burkina Faso', 'Chad', 'Central African Republic', 'Mozambique', 'Malawi', 'Namibia', 'Botswana', 'Lesotho', 'Eswatini', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros', 'Djibouti', 'Mauritania', 'Cape Verde', 'Sao Tome and Principe'],
  europe: ['Europe', 'Italy', 'France', 'Spain', 'Germany', 'Netherlands', 'Holland', 'Flanders', 'Belgium', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'United Kingdom', 'Britain', 'Ireland', 'Portugal', 'Austria', 'Switzerland', 'Greece', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Iceland', 'Poland', 'Czech Republic', 'Czechia', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Serbia', 'Croatia', 'Slovenia', 'Bosnia', 'Montenegro', 'Albania', 'North Macedonia', 'Kosovo', 'Estonia', 'Latvia', 'Lithuania', 'Ukraine', 'Belarus', 'Moldova', 'Malta', 'Luxembourg', 'Monaco', 'Andorra', 'Liechtenstein', 'San Marino', 'Vatican', 'Paris', 'London', 'Venice', 'Florence', 'Rome', 'Saint Remy de Provence'],
  'north-america': ['North America', 'Central America', 'Mesoamerica', 'United States', 'USA', 'U S A', 'Canada', 'Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Haiti', 'Dominican Republic', 'Jamaica', 'Puerto Rico', 'Bahamas', 'Barbados', 'Trinidad', 'Tobago', 'Grenada', 'Dominica', 'Saint Lucia', 'Antigua', 'Barbuda', 'Saint Kitts', 'Nevis', 'Saint Vincent', 'Grenadines', 'Greenland', 'Chicago', 'New York', 'Tenochtitlan'],
  'south-america': ['South America', 'Peru', 'Brazil', 'Chile', 'Argentina', 'Colombia', 'Ecuador', 'Bolivia', 'Venezuela', 'Uruguay', 'Paraguay', 'Guyana', 'Suriname', 'French Guiana'],
  oceania: ['Oceania', 'Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Samoa', 'Tonga', 'Vanuatu', 'Kiribati', 'Tuvalu', 'Nauru', 'Palau', 'Micronesia', 'Marshall Islands', 'New Caledonia', 'French Polynesia', 'Cook Islands', 'Niue', 'Tahiti', 'Melanesia', 'Polynesia', 'Aboriginal'],
  antarctica: ['Antarctica', 'Antarctic'],
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const originRules = Object.entries(ORIGINS).map(([continent, aliases]) => ({
  continent: continent as Continent,
  aliases: aliases.map((alias) => ` ${normalize(alias)} `),
}))

// Use recorded production location, not the artist's nationality.
// Ambiguous or conflicting locations receive one explicit Unknown category.
export function artworkContinent(artwork: Pick<Artwork, 'place_of_origin'>): Continent {
  const origin = ` ${normalize(artwork.place_of_origin ?? '')} `
  const matches = originRules.filter((rule) => rule.aliases.some((alias) => origin.includes(alias)))
  return matches.length === 1 ? matches[0].continent : 'unknown'
}

export function continentLabel(continent: Continent): string {
  return CONTINENTS.find((item) => item.id === continent)!.label
}

export function selectedContinent(params: URLSearchParams): Continent | '' {
  const selection = params.get('continent')
  return CONTINENTS.find((item) => item.id === selection)?.id ?? ''
}
