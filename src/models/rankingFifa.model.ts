export interface RankingFifa {
  name: string;
  equipos: RankingFifaEquipo[];
}

export interface RankingFifaEquipo {
  "pais": string;
  "historial": Historial[];
}

export interface Historial {
  "fecha": string;
  "puesto": number;
  "incremento": number;
  "puntaje": number;
}