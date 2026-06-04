export interface Prediction {
    partidoId: string;
    team1: string;
    team2: string;
    prediction: any;
    puntos: number | null;
    acierto: string | null;
    timestamp: number;
    resultadoReal?: any;
  }
  
  export interface UserWorldCupData {
    phone: string;
    locura: number;
    predictions: Prediction[];
    predictionsHistory: Prediction[];
    equipoFavorito: string;
    name: string;
    email?: string;
    matchesFound: number;
    lastActive: number;
    currentTrivia?: any;
    pendingPrediction?: any;
  }