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
    const clean = removeAccents(input.trim().toLowerCase());
  
    // 2. Diccionario elástico de variantes y modismos mundiales
    // Aquí interceptamos lo que el usuario ponga y lo convertimos al formato de tu JSON
    const sinonimos: { [key: string]: string } = {
      "mejico": "mexico",
      "korea": "corea del sur",
      "corea": "corea del sur",
      "south africa": "sudafrica",
      "republica checa": "republica checa",
      "chequia": "republica checa",
      "czechia": "republica checa",
      "bosnia": "bosnia y herzegovina",
      "eeuu": "eeuu",
      "usa": "eeuu",
      "estados unidos": "eeuu",
      "united states": "eeuu",
      "canada": "canada",
      "qatar": "qatar",
      "catar": "qatar"
    };
  
    // Si la palabra limpia está en nuestro diccionario, devolvemos el mapeo estricto
    if (sinonimos[clean]) {
      return sinonimos[clean];
    }
  
    // Búsqueda por palabra clave integrada (ej: si escriben "herzegovina" -> "bosnia y herzegovina")
    if (clean.includes("bosnia") || clean.includes("herzegovina")) return "bosnia y herzegovina";
    if (clean.includes("corea") || clean.includes("korea")) return "corea del sur";
    if (clean.includes("checa") || clean.includes("chequia")) return "republica checa";
    if (clean.includes("estados unidos") || clean.includes("usa")) return "eeuu";
  
    // Si no requiere mapeo especial, devolvemos el texto sanitizado básico
    return clean;
  }