
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
    
      await flowDynamic(`🔥 *¡BIENVENIDO A LA ZONA DE CANDELA MUNDIALISTA! 🔥, ${userName.toUpperCase()}!* 🎉

      ¡Hola! Bienvenido al Bot Oficial del Mundial 2026. ⚽🤖,
      
      *Comandos disponibles:*
      1. *TRIVIA* - Reta y pon a prueba tus conocimientos 🧠
      2. *RANKING* - Consulta el ranking FIFA 2026 🏆
      3. *PREDIGO* - Juega tus propios pronósticos 🔮
      4. *OJO DEL DT* - Pronóstico nuestro cerebro artificial 🤖
      5. *JUGADA MATEMÁTICA* - Los 5 marcadores más probables 📈
      6. *PROXIMOS* - Próximos partidos ⚽
      7. *EQUIPOS* - Todas las selecciones 🌍
      8. *CALENDARIO* - Partidos completos 📅
      9. *SUSCRIPCIÓN* - Resúmenes diarios y goles en tu WhatsApp 📨
      
      ${partidosTexto}
      
      ⚡ _¿Cuál es tu primera jugada? Responde directamente con el número de tu opción:_`);
  });