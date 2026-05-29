import { addKeyword, EVENTS } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';

const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

export const welcomeFlow = addKeyword(EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const userName = ctx.pushName || 'Fanático';
    
    const user = await locuraService.getUser(phone);
    if (user.name === phone.slice(-8)) {
      user.name = userName;
      await locuraService.updateUser(phone, user);
    }
    
    const proximosPartidos = calendarService.getProximosPartidos(2);
    const partidosTexto = proximosPartidos.length > 0 
      ? `\n📅 *Próximos partidos:*\n${proximosPartidos.map(p => `• ${p.team1} vs ${p.team2} (${p.date})`).join('\n')}`
      : '';
    
    await flowDynamic(`🎉 *¡BIENVENIDO AL TERMÓMETRO DEL MUNDIAL, ${userName.toUpperCase()}!* 🎉

⚽ *Tu nivel de locura: ${user.locura}/100 pts*

  *Comandos disponibles:*
  • TRIVIA - Poné a prueba tus conocimientos
  • RANKING - Tabla de los más locos
  • TRISTE - Consuelo de la abuela
  • PREDIGO ARG 2-1 BRA - Pronosticá resultados
  • IA ARG vs BRA - Consulta la predicción de nuestra IA
  • PROXIMOS - Próximos partidos
  • EQUIPOS - Todas las selecciones
  • CALENDARIO - Partidos completos

  ${partidosTexto}`);
  });