import { addKeyword, EVENTS } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';

export const welcomeFlow = addKeyword(EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const userName = ctx.pushName || 'Fanático';
    const locuraService = new LocuraService();
    const calendarService = new FifaCalendarService();
    
    const user = await locuraService.getUser(phone);
    const proximosPartidos = calendarService.getProximosPartidos(2);
    
    await flowDynamic(`🎉 *¡HOLA ${userName.toUpperCase()}!* ⚽\n\nTu nivel de locura: ${user.locura}/100 pts\n\nComandos: TRIVIA, RANKING, TRISTE, PREDIGO`);
  });