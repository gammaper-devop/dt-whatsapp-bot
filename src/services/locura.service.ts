import { UserWorldCupData, Prediction } from '../models/user.model';

export class LocuraService {
  private static instance: LocuraService;
  private users: Map<string, UserWorldCupData> = new Map();

  private constructor() {}  // Constructor privado para singleton

  static getInstance(): LocuraService {
    if (!LocuraService.instance) {
      LocuraService.instance = new LocuraService();
    }
    return LocuraService.instance;
  }

  async getUser(phone: string): Promise<UserWorldCupData> {
    if (this.users.has(phone)) {
      console.log(`📖 Usuario encontrado: ${phone} - Locura: ${this.users.get(phone)?.locura}`);
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
    console.log(`👤 NUEVO usuario registrado: ${phone} - Locura: ${user.locura}`);
    console.log(`📊 Total usuarios en memoria: ${this.users.size}`);
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
    user.locura = nuevaLocura;
    this.users.set(phone, user);
    console.log(`📈 ${phone} +${puntos} pts → Locura: ${nuevaLocura}`);
    console.log(`📊 Total usuarios: ${this.users.size}`);
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
    
    console.log(`📊 Generando ranking con ${users.length} usuarios:`);
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.phone.slice(-8)}): ${u.locura} pts`);
    });
    
    const ranking = users
      .sort((a, b) => b.locura - a.locura)
      .slice(0, limit);
    
    return ranking;
  }

  // Método para depuración
  getAllUsers(): UserWorldCupData[] {
    return Array.from(this.users.values());
  }
}