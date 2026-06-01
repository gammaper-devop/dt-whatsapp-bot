import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';
import { traducirAIngles } from '../utils/countries.translator';
import { MongoPrediction } from '../models/mongo.schemas';

const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

function parsePredictionHumana(text: string): any {
  const marcadorRegex = /([a-zA-Z\s]+?)\s+(\d+)\s*[-–]\s*(\d+)\s+([a-zA-Z\s]+)/i;
  const match = text.match(marcadorRegex);
  if (match) {
    return {
      team1: match[1].trim(),
      score1: parseInt(match[2]),
      score2: parseInt(match[3]),
      team2: match[4].trim()
    };
  }
  return null;
}

function parseConsultaIA(text: string): { eq1: string; eq2: string } | null {
  const regex = /([a-zA-Z\s]+?)\s+(?:vs|-|\s)\s*([a-zA-Z\s]+)/i;
  const match = text.match(regex);
  if (match) {
    return { eq1: match[1].trim(), eq2: match[2].trim() };
  }
  return null;
}

// =====================================================================
// OPT 4: EL ADIVINO HUMANO (Inmune a números fantasmas)
// =====================================================================
export const adivinoFlow = addKeyword(['solicitar_predigo_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    const proximos = calendarService.getProximosPartidos(3);
    const partidosLista = proximos.map(p => `• ${p.team1} vs ${p.team2}`).join('\n');

    await flowDynamic(`🔮 *EL ADIVINO: TU INSTINTO* 🔮\n\nIngresa tu pronóstico para cualquiera de los partidos oficiales.\n\n✍️ *Escríbelo exactamente así:*\n👉 \`Argentina 2 - 1 Brasil\`\n👉 \`Mexico 1 - 0 Sudafrica\`\n\n📅 *Partidos sugeridos:*\n${partidosLista}\n\n_Escribe tu marcador ahora mismo:_`);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack }) => {
    const phone = ctx.from;
    const message = ctx.body.trim();

    if (['menu', 'hola', 'ayuda', 'volver'].includes(message.toLowerCase())) {
      return; 
    }

    const parsed = parsePredictionHumana(message);
    
    if (!parsed) {
      return fallBack(`⚠️ *Formato incorrecto.*\n\nPor favor, escribe los dos países y sus goles separados por un guion.\nEjemplo: \`Argentina 2 - 1 Brasil\`\n\n_(O escribe *MENU* para cancelar)_`);
    }

    const t1Ingles = traducirAIngles(parsed.team1);
    const t2Ingles = traducirAIngles(parsed.team2);

    const todosLosPartidos = calendarService.getProximosPartidos(104);
    const partidoMatch = todosLosPartidos.find(p => 
      (p.team1.toLowerCase() === t1Ingles.toLowerCase() && p.team2.toLowerCase() === t2Ingles.toLowerCase()) ||
      (p.team1.toLowerCase() === t2Ingles.toLowerCase() && p.team2.toLowerCase() === t1Ingles.toLowerCase())
    );

    if (!partidoMatch) {
      return fallBack(`❌ No encontré un partido oficial entre *${parsed.team1}* y *${parsed.team2}* en el calendario.\n\nRevisa los nombres e intenta de nuevo o escribe *MENU*:`);
    }

    await MongoPrediction.create({
      phone,
      partidoId: partidoMatch.id,
      team1: parsed.team1,
      team2: parsed.team2,
      score1: parsed.score1,
      score2: parsed.score2,
      timestamp: Date.now()
    });

    const nuevaLocura = await locuraService.updateLocura(phone, 5);

    await flowDynamic(`🎰 *PREDICCIÓN GUARDADA* 🎰\n\n⚽ *Partido:* ${partidoMatch.team1} vs ${partidoMatch.team2}\n🎯 *Tu score:* ${parsed.team1} ${parsed.score1} - ${parsed.score2} ${parsed.team2}\n\n📈 *Bonus de locura:* +5 pts (Total: ${nuevaLocura}/100 pts)\n\n💡 _¡Tus datos servirán para reentrenar a nuestra IA al final de la jornada!_\n\n_Escribe *MENU* para volver al inicio._`);
  });

// =====================================================================
// OPT 5: CONSULTA ANALÍTICA IA (Inmune a números fantasmas)
// =====================================================================
export const iaConsultarFlow = addKeyword(['solicitar_ia_interna'])
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic(`🧠 *EL CONSULTOR ANALÍTICO IA* 🧠\n\n¿Qué partido quieres que procese el algoritmo *Random Forest*?\n\n✍️ *Escríbelo así:*\n👉 \`Colombia vs Uzbekistan\`\n👉 \`Argentina - Argelia\`\n\n_Escribe los equipos a consultar:_`);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack }) => {
    const message = ctx.body.trim();

    if (['menu', 'hola', 'ayuda', 'volver'].includes(message.toLowerCase())) {
      return;
    }

    const equipos = parseConsultaIA(message);

    if (!equipos) {
      return fallBack(`⚠️ *No entendí los rivales.*\n\nEscribe los dos países separados por la palabra *vs* o por un guion.\nEjemplo: \`Colombia vs Uzbekistan\`\n\n_(O escribe *MENU* para salir)_`);
    }

    await flowDynamic(`🧠 *Conectando con el Backend de Python...* ⏳\nTraduciendo y procesando Big Data para *${equipos.eq1}* vs *${equipos.eq2}*...`);

    const eq1Ingles = traducirAIngles(equipos.eq1);
    const eq2Ingles = traducirAIngles(equipos.eq2);

    const pronosticoIA = await locuraService.obtenerPronosticoIA(eq1Ingles, eq2Ingles);

    if (!pronosticoIA || pronosticoIA.error) {
      return fallBack(`❌ *Error de datos:* El modelo no posee registros suficientes para el cruce estadístico entre *${equipos.eq1}* y *${equipos.eq2}*.\n\nPrueba con otras selecciones oficiales de los grupos:`);
    }

    const flyerWhatsApp = `✨ *PRONÓSTICO DE LA IA DEL DT* ✨
    
⚽ *Partido:* ${equipos.eq1.toUpperCase()} vs ${equipos.eq2.toUpperCase()}

🛡️ *Doble Oportunidad:* ${pronosticoIA.doble_oportunidad.replace(eq1Ingles, equipos.eq1).replace(eq2Ingles, equipos.eq2)}
📊 *Probabilidades Netas:* ${equipos.eq1} (${pronosticoIA.probabilidad_1}%) | Empate (${pronosticoIA.probabilidad_empate}%) | ${equipos.eq2} (${pronosticoIA.probabilidad_2}%)
📈 *Más/Menos Goles:* ${pronosticoIA.mas_menos_goles}
✅ *Ambos Anotan:* ${pronosticoIA.ambos_anotan}
🎯 *Marcador Exacto:* ${pronosticoIA.marcador_exacto}

--------------------------------------------------
\n_Escribe *MENU* para regresar al menú principal._`;

    await flowDynamic(flyerWhatsApp);
  });