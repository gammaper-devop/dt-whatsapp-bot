
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
      
      *Opciones disponibles:*
      1. *OJO DEL DT* - Pronóstico nuestro cerebro artificial 🤖
      2. *JUGADA MATEMÁTICA* - Los 5 marcadores más probables 📈
      3. *PROXIMOS* - Próximos partidos ⚽
      4. *EQUIPOS* - Todas las selecciones 🌍
      5. *CALENDARIO* - Partidos completos 📅
      6. *SUSCRIPCIÓN* - Recibe alertas exclusivas 📨
      
      ${partidosTexto}
      
      ⚡ _¿Cuál es tu primera jugada? Responde directamente con el número de tu opción:_`);
  });