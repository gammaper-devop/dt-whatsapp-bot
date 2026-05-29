import { UserWorldCupData, Prediction } from '../models/user.model';

export class LocuraService {
  private static instance: LocuraService;
  private users: Map<string, UserWorldCupData> = new Map();

  private constructor() {}

  static getInstance(): LocuraService {
    if (!LocuraService.instance) {
      LocuraService.instance = new LocuraService();
    }
    return LocuraService.instance;
  }

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
    console.log(`👤 Nuevo usuario registrado: ${phone} - Locura: ${user.locura}`);
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
    
    return users.sort((a, b) => b.locura - a.locura).slice(0, limit);
  }

  getAllUsers(): UserWorldCupData[] {
    return Array.from(this.users.values());
  }

  /**
   * Conecta con la API de FastAPI para obtener el pronóstico de la IA
   */
  async obtenerPronosticoIA(equipo1: string, equipo2: string): Promise<any> {
    try {
      const url = `http://127.0.0.1:8000/api/v1/pronostico?equipo1=${encodeURIComponent(equipo1)}&equipo2=${encodeURIComponent(equipo2)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en la API de IA: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error al conectar con el Backend de IA:", error);
      return null;
    }
  }
} // <-- Esta es la llave final que cierra la clase LocuraService