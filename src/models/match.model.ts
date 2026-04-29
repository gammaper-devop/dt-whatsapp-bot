export interface Match {
    id: string;
    round: string;
    date: string;
    time: string;
    fechaHora: Date | null;
    team1: string;
    team2: string;
    group: string | null;
    ground: string;
    isKnockout: boolean;
    resultadoProcesado?: boolean;
    result?: {
      team1Score: number;
      team2Score: number;
    };
  }