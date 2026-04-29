import { UserWorldCupData, Prediction } from '../models/user.model';

export class LocuraService {
  private users: Map<string, UserWorldCupData> = new Map();

  async getUser(phone: string): Promise<UserWorldCupData> {
    if (this.users.has(phone)) {
      return this.users.get(phone)!;
    }
    
    const user: UserWorldCupData = {
      phone,
      name: phone.slice(-8),
      locura: 50,
      predictions: [],
      predictionsHistory: [],
      equipoFavorito: '',
      matchesFound: 0,
      lastActive: Date.now()
    };
    
    this.users.set(phone, user);
    return user;
  }

  async updateUser(phone: string, updates: Partial<UserWorldCupData>): Promise<UserWorldCupData> {
    const user = await this.getUser(phone);
    const updated = { ...user, ...updates, lastActive: Date.now() };
    this.users.set(phone, updated);
    return updated;
  }

  async updateLocura(phone: string, puntos: number): Promise<number> {
    const user = await this.getUser(phone);
    const nuevaLocura = Math.min(100, Math.max(0, user.locura + puntos));
    await this.updateUser(phone, { locura: nuevaLocura });
    return nuevaLocura;
  }

  async addPrediction(phone: string, partidoId: string, prediction: any): Promise<void> {
    const user = await this.getUser(phone);
    const newPrediction: Prediction = {
      partidoId,
      team1: prediction.team1,
      team2: prediction.team2,
      prediction,
      puntos: null,
      acierto: null,
      timestamp: Date.now()
    };
    user.predictions.push(newPrediction);
    user.predictionsHistory.push(newPrediction);
    await this.updateUser(phone, { predictions: user.predictions });
  }

  async getRanking(limit: number = 10): Promise<UserWorldCupData[]> {
    const users = Array.from(this.users.values());
    return users
      .sort((a, b) => b.locura - a.locura)
      .slice(0, limit);
  }
}