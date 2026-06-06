/**
 * Remueve tildes, diéresis y caracteres especiales de una cadena de texto.
 */
function removeAccents(text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Separa y elimina los caracteres de tildes
  }
  
  /**
   * Normaliza y mapea de forma inteligente las variantes de nombres de selecciones
   * al nombre exacto utilizado en la base de datos de rankingFifa2026.json.
   * * @param input Texto crudo ingresado por el usuario en WhatsApp.
   */
  export function normalizeTeamName(input: string): string {
    if (!input) return "";
  
    // 1. Limpieza inicial: minúsculas, remover tildes y espacios extremos
    let clean = removeAccents(input.trim().toLowerCase());

    clean = clean.replace(/\./g, "").replace(/\s+/g, " ");
    if (clean === "ee uu") clean = "eeuu";
  
    // 2. Diccionario elástico de variantes y modismos mundiales
    // Aquí interceptamos lo que el usuario ponga y lo convertimos al formato de tu JSON
    const sinonimos: { [key: string]: string } = {
      "mejico": "mexico", //[cite: 22]
      "korea": "corea del sur", //[cite: 22]
      "corea": "corea del sur", //[cite: 22]
      "south africa": "sudafrica", //[cite: 22]
      "republica checa": "republica checa", //[cite: 22]
      "chequia": "republica checa", //[cite: 22]
      "czechia": "republica checa", //[cite: 22]
      "bosnia": "bosnia y herzegovina", //[cite: 22]
      "turkiye": "turquia",             // 🌟 AGREGADO
      "turkey": "turquia",              // 🌟 AGREGADO
      "eeuu": "eeuu", //[cite: 22]
      "usa": "eeuu", //[cite: 22]
      "estados unidos": "eeuu", //[cite: 22]
      "united states": "eeuu", //[cite: 22]
      "canada": "canada", //[cite: 22]
      "qatar": "qatar", //[cite: 22]
      "catar": "qatar", //[cite: 22]
      "congo": "republica democratica del congo",
      "rd congo": "republica democratica del congo",
      "dr congo": "republica democratica del congo",
      "republica congo": "republica democratica del congo",
      "costa": "costa de marfil",
      "costa marfil": "costa de marfil",
      "costa de marfil": "costa de marfil",
      "ivory coast": "costa de marfil",
      "curasao": "curazao",
      "curacao": "curazao",
      "ghana": "ghana",
      "gana": "ghana",
      "cabo": "cabo verde",
      "verde": "cabo verde",
    };
  
    // Si la palabra limpia está en nuestro diccionario, devolvemos el mapeo estricto
    if (sinonimos[clean]) {
      return sinonimos[clean];
    }
  
    // Búsqueda por palabra clave integrada (ej: si escriben "herzegovina" -> "bosnia y herzegovina")
    if (clean.includes("bosnia") || clean.includes("herzegovina")) return "bosnia y herzegovina";
    if (clean.includes("corea") || clean.includes("korea")) return "corea del sur";
    if (clean.includes("checa") || clean.includes("chequia")) return "republica checa";
    if (clean.includes("estados unidos") || clean.includes("usa") || clean.includes("eeuu")) return "eeuu";
    if (clean.includes("turquia") || clean.includes("turk")) return "turquia";
    if (clean.includes("congo")) return "republica democratica del congo";
    if (clean.includes("costa") || clean.includes("marfil")) return "costa de marfil";
    if (clean.includes("curasao") || clean.includes("curacao")) return "curazao";
    if (clean.includes("ghana") || clean.includes("gana")) return "ghana";
    if (clean.includes("cabo") || clean.includes("verde")) return "cabo verde";
    // Si no requiere mapeo especial, devolvemos el texto sanitizado básico
    return clean;
  }