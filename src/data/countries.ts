// Atlas Sprint — core geography dataset.
// pop is in millions; area is km². numeric = ISO 3166-1 numeric, matching
// world-atlas topojson feature ids. neighbors lists only countries that are
// also in this dataset, and is only present when complete (neighbor questions
// rely on it being exhaustive w.r.t. this dataset).

export type Continent =
  | "Europe"
  | "Asia"
  | "Africa"
  | "North America"
  | "South America"
  | "Oceania";

export interface Country {
  id: string; // ISO 3166-1 alpha-2, lowercase (used for flag CDN)
  numeric: string; // ISO numeric, matches topojson feature id
  name: string;
  capital: string;
  continent: Continent;
  pop: number; // millions
  area: number; // km²
  neighbors?: string[]; // alpha-2 ids, complete w.r.t. dataset
  tiny?: boolean; // too small for shape/map questions
  noShape?: boolean; // silhouette renders badly (antimeridian wrap)
}

const c = (
  id: string,
  numeric: string,
  name: string,
  capital: string,
  continent: Continent,
  pop: number,
  area: number,
  extra: Partial<Country> = {}
): Country => ({ id, numeric, name, capital, continent, pop, area, ...extra });

export const COUNTRIES: Country[] = [
  // ---------- Europe ----------
  c("fr", "250", "France", "Paris", "Europe", 68.2, 551695, { neighbors: ["es", "be", "de", "ch", "it"] }),
  c("de", "276", "Germany", "Berlin", "Europe", 84.5, 357588, { neighbors: ["fr", "be", "nl", "dk", "pl", "cz", "at", "ch"] }),
  c("es", "724", "Spain", "Madrid", "Europe", 48.3, 505990, { neighbors: ["fr", "pt"] }),
  c("pt", "620", "Portugal", "Lisbon", "Europe", 10.4, 92212, { neighbors: ["es"] }),
  c("it", "380", "Italy", "Rome", "Europe", 58.9, 302073, { neighbors: ["fr", "ch", "at", "si"] }),
  c("ch", "756", "Switzerland", "Bern", "Europe", 8.8, 41285, { neighbors: ["fr", "de", "it", "at"] }),
  c("at", "040", "Austria", "Vienna", "Europe", 9.1, 83879, { neighbors: ["de", "ch", "it", "si", "hu", "sk", "cz"] }),
  c("pl", "616", "Poland", "Warsaw", "Europe", 37.7, 312696, { neighbors: ["de", "cz", "sk", "ua", "by", "lt", "ru"] }),
  c("cz", "203", "Czechia", "Prague", "Europe", 10.9, 78871, { neighbors: ["de", "pl", "sk", "at"] }),
  c("sk", "703", "Slovakia", "Bratislava", "Europe", 5.4, 49035, { neighbors: ["cz", "pl", "ua", "hu", "at"] }),
  c("hu", "348", "Hungary", "Budapest", "Europe", 9.6, 93028, { neighbors: ["at", "sk", "ua", "ro", "rs", "hr", "si"] }),
  c("ro", "642", "Romania", "Bucharest", "Europe", 19.0, 238398, { neighbors: ["hu", "ua", "md", "bg", "rs"] }),
  c("bg", "100", "Bulgaria", "Sofia", "Europe", 6.4, 110994, { neighbors: ["ro", "rs", "mk", "gr", "tr"] }),
  c("gr", "300", "Greece", "Athens", "Europe", 10.4, 131957, { neighbors: ["al", "mk", "bg", "tr"] }),
  c("rs", "688", "Serbia", "Belgrade", "Europe", 6.6, 77474, { neighbors: ["hu", "ro", "bg", "mk", "me", "ba", "hr"] }),
  c("hr", "191", "Croatia", "Zagreb", "Europe", 3.8, 56594, { neighbors: ["si", "hu", "rs", "ba", "me"] }),
  c("ba", "070", "Bosnia and Herzegovina", "Sarajevo", "Europe", 3.2, 51209, { neighbors: ["hr", "rs", "me"] }),
  c("me", "499", "Montenegro", "Podgorica", "Europe", 0.62, 13812, { neighbors: ["hr", "ba", "rs", "al"] }),
  c("mk", "807", "North Macedonia", "Skopje", "Europe", 1.8, 25713, { neighbors: ["rs", "bg", "gr", "al"] }),
  c("al", "008", "Albania", "Tirana", "Europe", 2.7, 28748, { neighbors: ["me", "mk", "gr"] }),
  c("si", "705", "Slovenia", "Ljubljana", "Europe", 2.1, 20273, { neighbors: ["it", "at", "hu", "hr"] }),
  c("nl", "528", "Netherlands", "Amsterdam", "Europe", 17.9, 41543, { neighbors: ["be", "de"] }),
  c("be", "056", "Belgium", "Brussels", "Europe", 11.8, 30528, { neighbors: ["nl", "de", "fr"] }),
  c("dk", "208", "Denmark", "Copenhagen", "Europe", 5.9, 42933, { neighbors: ["de"] }),
  c("no", "578", "Norway", "Oslo", "Europe", 5.5, 385207, { neighbors: ["se", "fi", "ru"] }),
  c("se", "752", "Sweden", "Stockholm", "Europe", 10.5, 450295, { neighbors: ["no", "fi"] }),
  c("fi", "246", "Finland", "Helsinki", "Europe", 5.6, 338440, { neighbors: ["se", "no", "ru"] }),
  c("ee", "233", "Estonia", "Tallinn", "Europe", 1.4, 45228, { neighbors: ["lv", "ru"] }),
  c("lv", "428", "Latvia", "Riga", "Europe", 1.9, 64589, { neighbors: ["ee", "lt", "by", "ru"] }),
  c("lt", "440", "Lithuania", "Vilnius", "Europe", 2.9, 65300, { neighbors: ["lv", "pl", "by", "ru"] }),
  c("by", "112", "Belarus", "Minsk", "Europe", 9.2, 207600, { neighbors: ["pl", "lt", "lv", "ru", "ua"] }),
  c("ua", "804", "Ukraine", "Kyiv", "Europe", 37.0, 603550, { neighbors: ["pl", "sk", "hu", "ro", "md", "by", "ru"] }),
  c("md", "498", "Moldova", "Chișinău", "Europe", 2.5, 33846, { neighbors: ["ro", "ua"] }),
  c("ru", "643", "Russia", "Moscow", "Europe", 144.4, 17098246, { noShape: true, neighbors: ["no", "fi", "ee", "lv", "lt", "pl", "by", "ua", "ge", "az", "kz", "mn", "cn", "kp"] }),
  c("gb", "826", "United Kingdom", "London", "Europe", 68.3, 242495, { neighbors: ["ie"] }),
  c("ie", "372", "Ireland", "Dublin", "Europe", 5.3, 70273, { neighbors: ["gb"] }),
  c("is", "352", "Iceland", "Reykjavík", "Europe", 0.39, 103000, { neighbors: [] }),
  c("tr", "792", "Türkiye", "Ankara", "Europe", 85.3, 783562, { neighbors: ["gr", "bg", "ge", "am", "az", "ir", "iq", "sy"] }),

  // ---------- Asia ----------
  c("cn", "156", "China", "Beijing", "Asia", 1410, 9596960, { neighbors: ["ru", "mn", "kz", "kg", "tj", "af", "pk", "in", "np", "mm", "la", "vn", "kp"] }),
  c("in", "356", "India", "New Delhi", "Asia", 1428, 3287263, { neighbors: ["pk", "cn", "np", "bd", "mm"] }),
  c("jp", "392", "Japan", "Tokyo", "Asia", 124.5, 377975, { neighbors: [] }),
  c("kr", "410", "South Korea", "Seoul", "Asia", 51.7, 100210, { neighbors: ["kp"] }),
  c("kp", "408", "North Korea", "Pyongyang", "Asia", 26.2, 120538, { neighbors: ["kr", "cn", "ru"] }),
  c("mn", "496", "Mongolia", "Ulaanbaatar", "Asia", 3.4, 1564110, { neighbors: ["ru", "cn"] }),
  c("kz", "398", "Kazakhstan", "Astana", "Asia", 20.0, 2724900, { neighbors: ["ru", "cn", "kg", "uz", "tm"] }),
  c("uz", "860", "Uzbekistan", "Tashkent", "Asia", 36.0, 447400, { neighbors: ["kz", "kg", "tj", "af", "tm"] }),
  c("tm", "795", "Turkmenistan", "Ashgabat", "Asia", 6.5, 488100, { neighbors: ["kz", "uz", "af", "ir"] }),
  c("kg", "417", "Kyrgyzstan", "Bishkek", "Asia", 7.0, 199951, { neighbors: ["kz", "uz", "tj", "cn"] }),
  c("tj", "762", "Tajikistan", "Dushanbe", "Asia", 10.1, 141400, { neighbors: ["kg", "uz", "af", "cn"] }),
  c("vn", "704", "Vietnam", "Hanoi", "Asia", 100, 331212, { neighbors: ["cn", "la", "kh"] }),
  c("th", "764", "Thailand", "Bangkok", "Asia", 71.8, 513120, { neighbors: ["mm", "la", "kh", "my"] }),
  c("mm", "104", "Myanmar", "Naypyidaw", "Asia", 54.2, 676578, { neighbors: ["bd", "in", "cn", "la", "th"] }),
  c("la", "418", "Laos", "Vientiane", "Asia", 7.6, 236800, { neighbors: ["cn", "mm", "th", "kh", "vn"] }),
  c("kh", "116", "Cambodia", "Phnom Penh", "Asia", 16.9, 181035, { neighbors: ["th", "la", "vn"] }),
  c("my", "458", "Malaysia", "Kuala Lumpur", "Asia", 34.3, 330803, { neighbors: ["th", "id"] }),
  c("id", "360", "Indonesia", "Jakarta", "Asia", 277.5, 1904569, { neighbors: ["my", "pg"] }),
  c("ph", "608", "Philippines", "Manila", "Asia", 117.3, 300000, { neighbors: [] }),
  c("bd", "050", "Bangladesh", "Dhaka", "Asia", 172.9, 147570, { neighbors: ["in", "mm"] }),
  c("pk", "586", "Pakistan", "Islamabad", "Asia", 240.5, 881913, { neighbors: ["in", "cn", "af", "ir"] }),
  c("af", "004", "Afghanistan", "Kabul", "Asia", 42.2, 652230, { neighbors: ["pk", "ir", "tm", "uz", "tj", "cn"] }),
  c("ir", "364", "Iran", "Tehran", "Asia", 89.2, 1648195, { neighbors: ["iq", "tr", "am", "az", "tm", "af", "pk"] }),
  c("iq", "368", "Iraq", "Baghdad", "Asia", 45.5, 438317, { neighbors: ["ir", "tr", "sy", "jo", "sa", "kw"] }),
  c("sa", "682", "Saudi Arabia", "Riyadh", "Asia", 36.9, 2149690, { neighbors: ["jo", "iq", "kw", "qa", "ae", "om", "ye"] }),
  c("il", "376", "Israel", "Jerusalem", "Asia", 9.8, 20770, { neighbors: ["lb", "sy", "jo", "eg"] }),
  c("jo", "400", "Jordan", "Amman", "Asia", 11.3, 89342, { neighbors: ["il", "sy", "iq", "sa"] }),
  c("sy", "760", "Syria", "Damascus", "Asia", 23.2, 185180, { neighbors: ["tr", "iq", "jo", "il", "lb"] }),
  c("lb", "422", "Lebanon", "Beirut", "Asia", 5.4, 10452, { neighbors: ["sy", "il"] }),
  c("ae", "784", "United Arab Emirates", "Abu Dhabi", "Asia", 9.5, 83600, { neighbors: ["sa", "om"] }),
  c("qa", "634", "Qatar", "Doha", "Asia", 2.7, 11586, { neighbors: ["sa"] }),
  c("kw", "414", "Kuwait", "Kuwait City", "Asia", 4.3, 17818, { neighbors: ["iq", "sa"] }),
  c("om", "512", "Oman", "Muscat", "Asia", 4.6, 309500, { neighbors: ["sa", "ae", "ye"] }),
  c("ye", "887", "Yemen", "Sanaa", "Asia", 34.4, 527968, { neighbors: ["sa", "om"] }),
  c("np", "524", "Nepal", "Kathmandu", "Asia", 30.9, 147181, { neighbors: ["in", "cn"] }),
  c("lk", "144", "Sri Lanka", "Colombo", "Asia", 21.9, 65610, { neighbors: [] }),
  c("ge", "268", "Georgia", "Tbilisi", "Asia", 3.7, 69700, { neighbors: ["ru", "tr", "am", "az"] }),
  c("am", "051", "Armenia", "Yerevan", "Asia", 2.8, 29743, { neighbors: ["ge", "tr", "az", "ir"] }),
  c("az", "031", "Azerbaijan", "Baku", "Asia", 10.4, 86600, { neighbors: ["ru", "ge", "am", "tr", "ir"] }),
  c("sg", "702", "Singapore", "Singapore", "Asia", 5.9, 728, { tiny: true, neighbors: [] }),

  // ---------- Africa ----------
  c("eg", "818", "Egypt", "Cairo", "Africa", 112.7, 1002450, { neighbors: ["ly", "sd", "il"] }),
  c("ly", "434", "Libya", "Tripoli", "Africa", 6.9, 1759540, { neighbors: ["eg", "sd", "td", "ne", "dz", "tn"] }),
  c("tn", "788", "Tunisia", "Tunis", "Africa", 12.5, 163610, { neighbors: ["dz", "ly"] }),
  c("dz", "012", "Algeria", "Algiers", "Africa", 45.6, 2381741, { neighbors: ["tn", "ly", "ne", "ml", "ma"] }),
  c("ma", "504", "Morocco", "Rabat", "Africa", 37.8, 446550, { neighbors: ["dz"] }),
  c("sd", "729", "Sudan", "Khartoum", "Africa", 48.1, 1861484, { neighbors: ["eg", "ly", "td", "ss", "et", "er"] }),
  c("ss", "728", "South Sudan", "Juba", "Africa", 11.1, 619745, { neighbors: ["sd", "et", "ke", "ug", "cd"] }),
  c("et", "231", "Ethiopia", "Addis Ababa", "Africa", 126.5, 1104300, { neighbors: ["er", "sd", "ss", "ke", "so"] }),
  c("er", "232", "Eritrea", "Asmara", "Africa", 3.7, 117600, { neighbors: ["sd", "et"] }),
  c("so", "706", "Somalia", "Mogadishu", "Africa", 18.1, 637657, { neighbors: ["et", "ke"] }),
  c("ke", "404", "Kenya", "Nairobi", "Africa", 55.1, 580367, { neighbors: ["so", "et", "ss", "ug", "tz"] }),
  c("ug", "800", "Uganda", "Kampala", "Africa", 48.6, 241550, { neighbors: ["ke", "ss", "cd", "rw", "tz"] }),
  c("tz", "834", "Tanzania", "Dodoma", "Africa", 67.4, 945087, { neighbors: ["ke", "ug", "rw", "cd", "zm", "mz"] }),
  c("rw", "646", "Rwanda", "Kigali", "Africa", 14.1, 26338, { neighbors: ["ug", "cd", "tz"] }),
  c("cd", "180", "DR Congo", "Kinshasa", "Africa", 102.3, 2344858, { neighbors: ["cg", "ss", "ug", "rw", "tz", "zm", "ao"] }),
  c("cg", "178", "Republic of the Congo", "Brazzaville", "Africa", 6.1, 342000, { neighbors: ["ga", "cm", "cd", "ao"] }),
  c("ga", "266", "Gabon", "Libreville", "Africa", 2.4, 267668, { neighbors: ["cg", "cm"] }),
  c("cm", "120", "Cameroon", "Yaoundé", "Africa", 28.6, 475442, { neighbors: ["ng", "td", "cg", "ga"] }),
  c("ng", "566", "Nigeria", "Abuja", "Africa", 223.8, 923768, { neighbors: ["ne", "td", "cm"] }),
  c("ne", "562", "Niger", "Niamey", "Africa", 27.2, 1267000, { neighbors: ["dz", "ly", "td", "ng", "ml", "bf"] }),
  c("td", "148", "Chad", "N'Djamena", "Africa", 18.3, 1284000, { neighbors: ["ly", "sd", "ne", "ng", "cm"] }),
  c("ml", "466", "Mali", "Bamako", "Africa", 23.3, 1240192, { neighbors: ["dz", "ne", "bf", "ci", "gn", "sn"] }),
  c("bf", "854", "Burkina Faso", "Ouagadougou", "Africa", 23.3, 274200, { neighbors: ["ml", "ne", "ci", "gh"] }),
  c("gh", "288", "Ghana", "Accra", "Africa", 34.1, 238533, { neighbors: ["ci", "bf"] }),
  c("ci", "384", "Ivory Coast", "Yamoussoukro", "Africa", 28.9, 322463, { neighbors: ["gh", "bf", "ml", "gn"] }),
  c("gn", "324", "Guinea", "Conakry", "Africa", 14.2, 245857, { neighbors: ["ci", "ml", "sn"] }),
  c("sn", "686", "Senegal", "Dakar", "Africa", 17.8, 196722, { neighbors: ["ml", "gn"] }),
  c("ao", "024", "Angola", "Luanda", "Africa", 36.7, 1246700, { neighbors: ["cd", "cg", "zm", "na"] }),
  c("zm", "894", "Zambia", "Lusaka", "Africa", 20.6, 752612, { neighbors: ["cd", "tz", "mz", "zw", "bw", "na", "ao"] }),
  c("zw", "716", "Zimbabwe", "Harare", "Africa", 16.7, 390757, { neighbors: ["zm", "mz", "za", "bw"] }),
  c("mz", "508", "Mozambique", "Maputo", "Africa", 33.9, 801590, { neighbors: ["tz", "zm", "zw", "za"] }),
  c("za", "710", "South Africa", "Pretoria", "Africa", 60.4, 1221037, { neighbors: ["na", "bw", "zw", "mz"] }),
  c("na", "516", "Namibia", "Windhoek", "Africa", 2.6, 824292, { neighbors: ["ao", "zm", "bw", "za"] }),
  c("bw", "072", "Botswana", "Gaborone", "Africa", 2.7, 581730, { neighbors: ["na", "zm", "zw", "za"] }),
  c("mg", "450", "Madagascar", "Antananarivo", "Africa", 30.3, 587041, { neighbors: [] }),

  // ---------- North America ----------
  c("us", "840", "United States", "Washington, D.C.", "North America", 339.9, 9833517, { noShape: true, neighbors: ["ca", "mx"] }),
  c("ca", "124", "Canada", "Ottawa", "North America", 40.1, 9984670, { neighbors: ["us"] }),
  c("mx", "484", "Mexico", "Mexico City", "North America", 128.5, 1964375, { neighbors: ["us", "gt", "bz"] }),
  c("gt", "320", "Guatemala", "Guatemala City", "North America", 18.1, 108889, { neighbors: ["mx", "bz", "hn", "sv"] }),
  c("bz", "084", "Belize", "Belmopan", "North America", 0.41, 22966, { neighbors: ["mx", "gt"] }),
  c("sv", "222", "El Salvador", "San Salvador", "North America", 6.4, 21041, { neighbors: ["gt", "hn"] }),
  c("hn", "340", "Honduras", "Tegucigalpa", "North America", 10.6, 112492, { neighbors: ["gt", "sv", "ni"] }),
  c("ni", "558", "Nicaragua", "Managua", "North America", 7.0, 130373, { neighbors: ["hn", "cr"] }),
  c("cr", "188", "Costa Rica", "San José", "North America", 5.2, 51100, { neighbors: ["ni", "pa"] }),
  c("pa", "591", "Panama", "Panama City", "North America", 4.5, 75417, { neighbors: ["cr", "co"] }),
  c("cu", "192", "Cuba", "Havana", "North America", 11.2, 109884, { neighbors: [] }),
  c("jm", "388", "Jamaica", "Kingston", "North America", 2.8, 10991, { neighbors: [] }),
  c("ht", "332", "Haiti", "Port-au-Prince", "North America", 11.7, 27750, { neighbors: ["do"] }),
  c("do", "214", "Dominican Republic", "Santo Domingo", "North America", 11.3, 48671, { neighbors: ["ht"] }),

  // ---------- South America ----------
  c("br", "076", "Brazil", "Brasília", "South America", 216.4, 8515767, { neighbors: ["co", "ve", "gy", "sr", "pe", "bo", "py", "ar", "uy"] }),
  c("ar", "032", "Argentina", "Buenos Aires", "South America", 45.8, 2780400, { neighbors: ["cl", "bo", "py", "br", "uy"] }),
  c("cl", "152", "Chile", "Santiago", "South America", 19.6, 756102, { neighbors: ["pe", "bo", "ar"] }),
  c("pe", "604", "Peru", "Lima", "South America", 34.4, 1285216, { neighbors: ["ec", "co", "br", "bo", "cl"] }),
  c("co", "170", "Colombia", "Bogotá", "South America", 52.1, 1141748, { neighbors: ["pa", "ve", "ec", "pe", "br"] }),
  c("ve", "862", "Venezuela", "Caracas", "South America", 28.4, 916445, { neighbors: ["co", "br", "gy"] }),
  c("ec", "218", "Ecuador", "Quito", "South America", 18.2, 276841, { neighbors: ["co", "pe"] }),
  c("bo", "068", "Bolivia", "Sucre", "South America", 12.4, 1098581, { neighbors: ["pe", "br", "py", "ar", "cl"] }),
  c("py", "600", "Paraguay", "Asunción", "South America", 6.9, 406752, { neighbors: ["bo", "br", "ar"] }),
  c("uy", "858", "Uruguay", "Montevideo", "South America", 3.4, 181034, { neighbors: ["ar", "br"] }),
  c("gy", "328", "Guyana", "Georgetown", "South America", 0.81, 214969, { neighbors: ["ve", "br", "sr"] }),
  c("sr", "740", "Suriname", "Paramaribo", "South America", 0.62, 163820, { neighbors: ["gy", "br"] }),

  // ---------- Oceania ----------
  c("au", "036", "Australia", "Canberra", "Oceania", 26.4, 7692024, { neighbors: [] }),
  c("nz", "554", "New Zealand", "Wellington", "Oceania", 5.2, 270467, { neighbors: [] }),
  c("pg", "598", "Papua New Guinea", "Port Moresby", "Oceania", 10.3, 462840, { neighbors: ["id"] }),
  c("fj", "242", "Fiji", "Suva", "Oceania", 0.94, 18274, { noShape: true, neighbors: [] }),
  c("sb", "090", "Solomon Islands", "Honiara", "Oceania", 0.74, 28896, { tiny: true, neighbors: [] }),
  c("vu", "548", "Vanuatu", "Port Vila", "Oceania", 0.33, 12189, { tiny: true, neighbors: [] }),
  c("ws", "882", "Samoa", "Apia", "Oceania", 0.22, 2842, { tiny: true, neighbors: [] }),
];

export const CONTINENTS: Continent[] = [
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
];

export const CONTINENT_META: Record<
  Continent,
  { emoji: string; tagline: string; color: string }
> = {
  Europe: { emoji: "🏰", tagline: "Castles, coastlines, capitals", color: "#4CC9F0" },
  Asia: { emoji: "⛩️", tagline: "The biggest of everything", color: "#FF5D8F" },
  Africa: { emoji: "🦁", tagline: "54 nations, endless variety", color: "#FFC53D" },
  "North America": { emoji: "🗽", tagline: "From tundra to tropics", color: "#7C5CE0" },
  "South America": { emoji: "🦜", tagline: "Andes, Amazon, and more", color: "#3DDC97" },
  Oceania: { emoji: "🏝️", tagline: "A continent of islands", color: "#2EC4B6" },
};

export const byId = new Map(COUNTRIES.map((x) => [x.id, x]));
export const byNumeric = new Map(COUNTRIES.map((x) => [x.numeric, x]));

export const flagUrl = (id: string, size: 160 | 320 = 160) =>
  `https://flagcdn.com/w${size}/${id}.png`;

export const ofContinent = (cont: Continent) =>
  COUNTRIES.filter((x) => x.continent === cont);
