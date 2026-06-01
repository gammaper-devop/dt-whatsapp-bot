
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

Yo soy *El DT*, tu asistente de emociones futboleras.

⚽ *Tu nivel de locura: ${user.locura}/100 pts*

*Comandos disponibles:*
1. *TRIVIA* - Pon a prueba tus conocimientos 🧠
2. *RANKING* - Ver la tabla de los más locos 🏆
3. *TRISTE* - La abuela te consuela (cuando perdés) 👵
4. *PREDIGO* - Juega tus propios pronósticos 🔮
5. *IA* - Consulta la predicción de nuestra IA 🧠
6. *PROXIMOS* - Próximos partidos ⚽
7. *EQUIPOS* - Todas las selecciones 🌍
8. *CALENDARIO* - Partidos completos 📅
9. *PERFIL* - Configura tu perfil 👤

${partidosTexto}

👉 _Responde con el *NÚMERO* de la opción que desees._`);
  });