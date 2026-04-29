import fs from 'fs';
import path from 'path';
import { Match } from '../models/match.model';

export class FifaCalendarService {
  private partidos: Match[] = [];

  constructor() {
    this.cargarPartidos();
  }

  private cargarPartidos(): void {
    try {
      const jsonPath = path.join(__dirname, '../../../data/worldcup2026.json');
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      const jsonData = JSON.parse(rawData);
      
      this.partidos = jsonData.matches.map((match: any) => {
        let fechaHora: Date | null = null;
        if (match.date && match.time) {
          const horaMatch = match.time.match(/(\d{2}):(\d{2})/);
          if (horaMatch) {
            fechaHora = new Date(match.date);
            fechaHora.setHours(parseInt(horaMatch[1]), parseInt(horaMatch[2]), 0);
          }
        }
        
        const isKnockout = !['Matchday 1', 'Matchday 2', 'Matchday 3', 'Matchday 4', 'Matchday 5', 
                              'Matchday 6', 'Matchday 7', 'Matchday 8', 'Matchday 9', 'Matchday 10',
                              'Matchday 11', 'Matchday 12', 'Matchday 13', 'Matchday 14', 'Matchday 15',
                              'Matchday 16', 'Matchday 17'].includes(match.round);
        
        return {
          id: match.num || `${match.round}_${match.team1}_${match.team2}`,
          round: match.round,
          date: match.date,
          time: match.time,
          fechaHora,
          team1: match.team1,
          team2: match.team2,
          group: match.group || null,
          ground: match.ground,
          isKnockout
        };
      });
      
      console.log(`✅ Cargados ${this.partidos.length} partidos del Mundial 2026`);
    } catch (error) {
      console.error('Error cargando calendario:', error);
      this.partidos = [];
    }
  }

  getProximosPartidos(cantidad: number = 3): Match[] {
    const ahora = new Date();
    return this.partidos
      .filter(p => p.fechaHora && p.fechaHora > ahora)
      .sort((a, b) => (a.fechaHora!.getTime() - b.fechaHora!.getTime()))
      .slice(0, cantidad);
  }

  getPartidoById(id: string): Match | undefined {
    return this.partidos.find(p => p.id === id);
  }

  getTodosLosEquipos(): string[] {
    const equipos = new Set<string>();
    this.partidos.forEach(p => {
      if (!p.team1.match(/^\d/) && !p.team1.includes('W')) {
        equipos.add(p.team1);
        equipos.add(p.team2);
      }
    });
    return Array.from(equipos).sort();
  }
}