export const countryMap: Record<string, string> = {
  // --- CONMEBOL ---
  "argentina": "Argentina",
  "brasil": "Brazil",
  "brazil": "Brazil",
  "colombia": "Colombia",
  "uruguay": "Uruguay",
  "ecuador": "Ecuador",
  "peru": "Peru",
  "chile": "Chile",
  "venezuela": "Venezuela",
  "paraguay": "Paraguay",
  "bolivia": "Bolivia",

  // --- UEFA ---
  "francia": "France",
  "france": "France",
  "inglaterra": "England",
  "england": "England",
  "alemania": "Germany",
  "germany": "Germany",
  "espana": "Spain",
  "spain": "Spain",
  "italia": "Italy",
  "italy": "Italy",
  "portugal": "Portugal",
  "holanda": "Netherlands",
  "paises bajos": "Netherlands",
  "netherlands": "Netherlands",
  "croacia": "Croatia",
  "croatia": "Croatia",
  "belgica": "Belgium",
  "belgium": "Belgium",
  "escocia": "Scotland",
  "scotland": "Scotland",
  "noruega": "Norway",
  "norway": "Norway",
  "republica checa": "Czech Republic",
  "czech republic": "Czech Republic",
  "chequia": "Czech Republic",
  "suiza": "Switzerland",
  "switzerland": "Switzerland",
  "turquia": "Turkey",
  "turkiye": "Turkey",
  "turkey": "Turkey",
  "austria": "Austria",
  "suecia": "Sweden",
  "sweden": "Sweden",
  "bosnia": "Bosnia and Herzegovina",
  "bosnia y herzegovina": "Bosnia and Herzegovina",
  "bosnia herzegovina": "Bosnia and Herzegovina",

  // --- CONCACAF (Alineación con results.csv de Python) ---
  "mexico": "Mexico",
  "eeuu": "United States",
  "ee.uu": "United States",
  "ee.uu.": "United States",
  "usa": "United States",
  "estados unidos": "United States",
  "united states": "United States",
  "canada": "Canada",
  "panama": "Panama",
  "haiti": "Haiti",
  "curazao": "Curaçao",
  "curacao": "Curaçao",

  // --- CAF ---
  "sudafrica": "South Africa",
  "south africa": "South Africa",
  "argelia": "Algeria",
  "algeria": "Algeria",
  "marruecos": "Morocco",
  "morocco": "Morocco",
  "senegal": "Senegal",
  "tunez": "Tunisia",
  "tunisia": "Tunisia",
  "egipto": "Egypt",
  "egypt": "Egypt",
  "nigeria": "Nigeria",
  "costa de marfil": "Ivory Coast",
  "ivory coast": "Ivory Coast",
  "republica democratica del congo": "DR Congo",
  "rd congo": "DR Congo",
  "dr congo": "DR Congo",
  "congo": "DR Congo",
  "ghana": "Ghana",
  "cabo verde": "Cape Verde",
  "cape verde": "Cape Verde",

  // --- AFC & OFC ---
  "japon": "Japan",
  "japan": "Japan",
  "corea del sur": "South Korea",
  "south korea": "South Korea",
  "corea": "South Korea",
  "australia": "Australia",
  "arabia saudita": "Saudi Arabia",
  "saudi arabia": "Saudi Arabia",
  "arabia": "Saudi Arabia",
  "uzbekistan": "Uzbekistan",
  "qatar": "Qatar",
  "catar": "Qatar",
  "iran": "Iran",
  "nueva zelanda": "New Zealand",
  "new zealand": "New Zealand",
  "irak": "Iraq",
  "iraq": "Iraq",
  "jordania": "Jordan",
  "jordan": "Jordan"
};

export function traducirAIngles(nombreEsp: string): string {
  if (!nombreEsp) return "";
  
  // Convertimos a minúsculas, removemos espacios extra y limpiamos acentos
  let limpio = nombreEsp.toLowerCase().trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
    
  // Destruimos puntos y espacios intermedios para unificar "ee.uu" -> "eeuu"
  limpio = limpio.replace(/\./g, "").replace(/\s+/g, " ");
  if (limpio === "ee uu") limpio = "eeuu";
    
  return countryMap[limpio] || nombreEsp;
}