import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';

function parsePrediction(text: string): any {
  const marcadorRegex = /(\w+)\s+(\d+)\s*[-–]\s*(\d+)\s+(\w+)/i;
  const match = text.match(marcadorRegex);
  
  if (match) {
    return {
      team1: match[1],
      score1: parseInt(match[2]),
      score2: parseInt(match[3]),
      team2: match[4],
      type: 'exact'
    };
  }
  
  const ganaRegex = /(\w+)\s+gana/i;
  const ganaMatch = text.match(ganaRegex);
  if (ganaMatch) {
    return { winner: ganaMatch[1], type: 'winner' };
  }
  
  if (text.match(/empate/i)) {
    return { draw: true, type: 'draw' };
  }
  
  return null;
}

function formatPrediction(pred: any): string {
  if (pred.type === 'exact') return `${pred.team1} ${pred.score1} - ${pred.score2} ${pred.team2}`;
  if (pred.type === 'winner') return `Gana ${pred.winner}`;
  if (pred.type === 'draw') return "Empate";
  return "Predicción";
}

export const adivinoFlow = addKeyword(['predigo', 'predecir', 'pronostico'])
  .addAction(async (ctx, { flowDynamic, state }) => {
    const phone = ctx.from;
    const message = ctx.body;
    const locuraService = new LocuraService();
    const calendarService = new FifaCalendarService();
    
    const predictionText = message.replace(/predigo|predecir|pronostico/i, '').trim();
    const parsedPrediction = parsePrediction(predictionText);
    
    if (!parsedPrediction) {
      const proximos = calendarService.getProximosPartidos(3);
      const partidosLista = proximos.map((p, i) => `${i+1}. ${p.team1} vs ${p.team2} (${p.date})`).join('\n');
      
      await flowDynamic(`🔮 *EL ADIVINO* 🔮\n\nNo entendí tu predicción. Usá formatos como:\n• "PREDIGO ARG 2 - 1 BRA"\n• "PREDIGO ARG gana"\n• "PREDIGO empate"\n\n✨ *Puntajes:* Marcado exacto: +50, Ganador: +20, Empate: +10\n\n📅 *Próximos partidos:*\n${partidosLista}`);
      return;
    }
    
    const proximos = calendarService.getProximosPartidos(1);
    if (proximos.length === 0) {
      await flowDynamic("❌ No hay partidos próximos para predecir. Volvé más tarde.");
      return;
    }
    
    const partido = proximos[0];
    await locuraService.addPrediction(phone, partido.id, parsedPrediction);
    
    await flowDynamic(`🔮 *PREDICCIÓN REGISTRADA* 🔮\n\n⚽ ${partido.team1} vs ${partido.team2}\n📅 ${partido.date}\n🎲 Tu predicción: ${formatPrediction(parsedPrediction)}\n\n✅ ¡Guardado! Volvé después del partido para ver tus puntos.`);
  });