import { normalizeTeamName } from "./normalizeTeamName";

export interface ParsedPrediction {
  isValid: boolean;
  team1?: string;
  score1?: number;
  score2?: number;
  team2?: string;
}

export function parsePrediction(input: string): ParsedPrediction {
  if (!input) return { isValid: false };

  // Nueva RegEx Híbrida Inteligente:
  // Busca dos bloques de texto (países) y dos bloques numéricos (goles) en cualquier variante de espacios, guiones o "vs"
  const regexTradicional = /^([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)\s+(\d+)\s*(?:vs|-)\s*(\d+)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)$/i;
  const regexAlternativa = /^([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)\s+(\d+)\s*(?:vs|-)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)\s+(\d+)$/i;

  let match = input.trim().match(regexTradicional);
  let rawTeam1 = "";
  let score1 = 0;
  let score2 = 0;
  let rawTeam2 = "";

  if (match) {
    rawTeam1 = match[1].trim();
    score1 = parseInt(match[2], 10);
    score2 = parseInt(match[3], 10);
    rawTeam2 = match[4].trim();
  } else {
    // Intentamos con el segundo formato común: "País 2 vs País 1"
    match = input.trim().match(regexAlternativa);
    if (match) {
      rawTeam1 = match[1].trim();
      score1 = parseInt(match[2], 10);
      rawTeam2 = match[3].trim();
      score2 = parseInt(match[4], 10);
    } else {
      // Tercer intento: Formato plano puro de marcadores rápidos "México vs Sudáfrica 2-2"
      const regexPlano = /^([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)\s*(?:vs|-)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+)\s+(\d+)\s*[-]\s*(\d+)$/i;
      match = input.trim().match(regexPlano);
      if (match) {
        rawTeam1 = match[1].trim();
        rawTeam2 = match[2].trim();
        score1 = parseInt(match[3], 10);
        score2 = parseInt(match[4], 10);
      } else {
        return { isValid: false };
      }
    }
  }

  const team1 = normalizeTeamName(rawTeam1);
  const team2 = normalizeTeamName(rawTeam2);

  return {
    isValid: true,
    team1,
    score1,
    score2,
    team2
  };
}