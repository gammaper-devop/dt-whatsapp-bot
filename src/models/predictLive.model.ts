export interface ScoreProbability {
    score: string;
    prob: number;
  }
  
export interface PredictLiveResponse {
    metodo: string;
    encuentro: string;
    probabilidades_1X2: {
      gana_local: number;
      empate: number;
      gana_visitante: number;
    };
    marcadores_mas_probables: ScoreProbability[];
    analisis_cuota: string;
  }