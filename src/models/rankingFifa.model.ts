export interface RankingFifa {
  name: string;
  equipos: RankingFifaEquipo[];
}

export interface RankingFifaEquipo {
  id: number;
  pais: string;
  incremento: number;
  puntaje: number;
}