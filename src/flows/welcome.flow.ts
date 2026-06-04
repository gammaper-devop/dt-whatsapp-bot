
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
    
    await flowDynamic(`🎉 *¡BIENVENIDO AL BOT OFICIAL DEL MUNDIAL 2026, ${userName.toUpperCase()}!* 🎉

"¡Hola! Bienvenido al Bot Oficial del Mundial 2026. ⚽🤖",

*Comandos disponibles:*
1. *TRIVIA* - Poné a prueba tus conocimientos 🧠
2. *RANKING* - Consulta el ranking FIFA 2026 🏆
3. *PREDIGO* - Juega tus propios pronósticos 🔮
4. *IA* - Consulta la predicción de nuestra IA 🧠
5. *PROXIMOS* - Próximos partidos ⚽
6. *EQUIPOS* - Todas las selecciones 🌍
7. *CALENDARIO* - Partidos completos 📅
8. *SUSCRIPCIÓN* - Recibe alertas exclusivas 📨

${partidosTexto}

👉 _Responde con el *NÚMERO* de la opción que desees._`);
  });