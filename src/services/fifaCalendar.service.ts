import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Match } from '../models/match.model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FifaCalendarService {
  private partidos: Match[] = [];
  private grupos: { [key: string]: Match[] } = {};

  constructor() {
    this.cargarPartidos();
  }

  private cargarPartidos(): void {
    try {
      let jsonPath = path.join(__dirname, '../../../../mundial_chatbot/base-ts-baileys-memory/data/worldcup2026_spanish.json');
      
      if (!fs.existsSync(jsonPath)) {
        jsonPath = path.join(process.cwd(), 'data', 'worldcup2026_spanish.json');
      }
      
      console.log('📂 Buscando calendario en:', jsonPath);
      
      if (!fs.existsSync(jsonPath)) {
        console.error('❌ Archivo no encontrado:', jsonPath);
        this.partidos = [];
        return;
      }
      
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      const jsonData = JSON.parse(rawData);
      
      this.partidos = jsonData.matches.map((match: any) => {
        let fechaHora: Date | null = null;
        if (match.date && match.time) {
          const horaMatch = match.time.match(/(\d{2}):(\d{2})/);
          if (horaMatch) {
            fechaHora = new Date(match.date);
            // Ajustamos horas UTC-6 o UTC-4 de manera segura
            fechaHora.setHours(parseInt(horaMatch[1]), parseInt(horaMatch[2]), 0);
          }
        }
        
        // CORRECCIÓN: Ahora validamos contra "Jornada" que es el término de tu JSON traducido
        const isKnockout = !['Jornada 1', 'Jornada 2', 'Jornada 3', 'Jornada 4', 'Jornada 5', 
                              'Jornada 6', 'Jornada 7', 'Jornada 8', 'Jornada 9', 'Jornada 10',
                              'Jornada 11', 'Jornada 12', 'Jornada 13', 'Jornada 14', 'Jornada 15',
                              'Jornada 16', 'Jornada 17'].includes(match.round);
        
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
      
      // Organizar por grupos
      this.grupos = {}; // Reset por seguridad
      this.partidos.forEach(match => {
        if (match.group && !match.isKnockout) {
          if (!this.grupos[match.group]) this.grupos[match.group] = [];
          this.grupos[match.group].push(match);
        }
      });
      
      console.log(`✅ Cargados ${this.partidos.length} partidos del Mundial 2026`);
    } catch (error) {
      console.error('Error cargando calendario:', error);
      this.partidos = [];
    }
  }

  // ============ MÉTODOS AUXILIARES ============
  
  private formatearFecha(dateStr: string): string {
    const partes = dateStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return dateStr;
  }

  // CORRECCIÓN: Ajustamos la expresión regular para que entienda "Jornada" en español
  private getMatchdayNumber(round: string): number {
    const match = round.match(/Jornada (\d+)/i);
    if (match) {
      return parseInt(match[1]);
    }
    if (round.includes('Dieciseisavos de final')) return 100;
    if (round.includes('Octavos de final')) return 101;
    if (round.includes('Cuartos de final')) return 102;
    if (round.includes('Semifinal')) return 103;
    if (round.includes('Partido por el tercer puesto')) return 104;
    if (round.includes('Final')) return 105;
    return 999;
  }

  // ============ MÉTODOS EXISTENTES ============
  
  getProximosPartidos(cantidad: number = 5): Match[] {
    const ahora = new Date();
    // Filtramos los partidos del JSON que tengan fecha válida posterior a la simulación actual
    const futuros = this.partidos.filter(p => p.fechaHora && p.fechaHora > ahora);
    
    if (futuros.length === 0) {
      return this.partidos.slice(0, cantidad);
    }
    
    return futuros
      .sort((a, b) => (a.fechaHora!.getTime() - b.fechaHora!.getTime()))
      .slice(0, cantidad);
  }

  getPartidoById(id: string): Match | undefined {
    return this.partidos.find(p => p.id === id);
  }

  getTodosLosPartidosRaw(): Match[] {
    return this.partidos;
  }

  getTodosLosEquipos(): string[] {
    const equipos = new Set<string>();
    this.partidos.forEach(p => {
      if (!p.team1.match(/^\d/) && !p.team1.includes('W') && !p.team1.includes('L')) {
        equipos.add(p.team1);
        equipos.add(p.team2);
      }
    });
    return Array.from(equipos).sort();
  }

  getGrupos(): { [key: string]: Match[] } {
    return this.grupos;
  }

  // ============ MÉTODOS PARA PRÓXIMOS PARTIDOS ============
  
  formatearListaProximos(partidos: Match[]): string {
    if (partidos.length === 0) {
      return '📭 No hay partidos próximos programados.';
    }
    
    let mensaje = '⚽ *PRÓXIMOS PARTIDOS* ⚽\n\n';
    
    partidos.forEach((p, idx) => {
      const emoji = p.isKnockout ? '🏆' : '📋';
      const fechaFormateada = this.formatearFecha(p.date);
      mensaje += `${emoji} ${idx + 1}. *${p.team1} vs ${p.team2}*\n`;
      mensaje += `   📅 ${fechaFormateada}\n`;
      mensaje += `   ⏰ ${p.time}\n`;
      mensaje += `   🏟️ ${p.ground}\n`;
      if (p.group) {
        mensaje += `   📌 ${p.group}\n`;
      }
      mensaje += '\n';
    });
    
    return mensaje;
  }

  // ============ MÉTODOS PARA EQUIPOS ============
  
  formatearListaEquipos(): string {
    const equipos = this.getTodosLosEquipos();
    const grupos = this.getGrupos();
    
    let mensaje = '🏆 *EQUIPOS DEL MUNDIAL 2026* 🏆\n\n';
    
    for (const [grupo, partidosDelGrupo] of Object.entries(grupos)) {
      const equiposEnGrupo = new Set<string>();
      partidosDelGrupo.forEach(p => {
        equiposEnGrupo.add(p.team1);
        equiposEnGrupo.add(p.team2);
      });
      
      mensaje += `*${grupo}:* ${Array.from(equiposEnGrupo).join(', ')}\n`;
    }
    
    mensaje += `\n📊 *Total: ${equipos.length} selecciones participantes*\n`;
    mensaje += `🌍 *Sedes:* México, Estados Unidos y Canadá\n`;
    
    return mensaje;
  }

  // ============ MÉTODOS PARA CALENDARIO COMPLETO ============
  
  getCalendarioCompleto(): string {
    const partidosOrdenados = [...this.partidos];
    
    partidosOrdenados.sort((a, b) => {
      const numA = this.getMatchdayNumber(a.round);
      const numB = this.getMatchdayNumber(b.round);
      
      if (numA !== numB) {
        return numA - numB;
      }
      
      if (a.fechaHora && b.fechaHora) {
        return a.fechaHora.getTime() - b.fechaHora.getTime();
      }
      return 0;
    });
    
    let calendario = '📅 *CALENDARIO COMPLETO MUNDIAL 2026* 📅\n\n';
    let rondaActual = '';
    let contador = 0;
    
    for (const partido of partidosOrdenados) {
      if (partido.round !== rondaActual) {
        rondaActual = partido.round;
        const emoji = this.getEmojiPorRonda(rondaActual);
        calendario += `\n${emoji} *${rondaActual.toUpperCase()}*\n`;
      }
      
      const fechaFormateada = this.formatearFecha(partido.date);
      calendario += `• ${fechaFormateada} | ${partido.team1} vs ${partido.team2}\n`;
      calendario += `  ⏰ ${partido.time} | 🏟️ ${partido.ground}\n`;
      contador++;
      
      if (contador > 45 && calendario.length > 1500) {
        const restantes = this.partidos.length - contador;
        calendario += `\n📌 *Y ${restantes} partidos más en el fixture...*\n`;
        break;
      }
    }
    
    calendario += `\n📊 *Total: ${this.partidos.length} partidos oficiales*`;
    return calendario;
  }

  private getEmojiPorRonda(ronda: string): string {
    if (ronda.includes('Jornada')) return '📋';
    if (ronda.includes('Dieciseisavos')) return '🔰';
    if (ronda.includes('Octavos')) return '🔰';
    if (ronda.includes('Cuartos')) return '🏆';
    if (ronda.includes('Semifinal')) return '🏆';
    if (ronda.includes('Final')) return '🏆👑';
    if (ronda.includes('tercer puesto')) return '🥉';
    return '⚽';
  }
}