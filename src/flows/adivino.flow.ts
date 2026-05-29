import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';
import { traducirAIngles } from '../utils/countries.translator';
import { MongoPrediction } from '../models/mongo.schemas';

const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

// REGLA DE EXTRACCIÓN HUMANA (Comando original: PREDIGO ARG 2-1 BRA)
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

// REGLA DE EXTRACCIÓN IA (Nuevo comando: IA ARG vs BRA o IA ARG BRA)
function parseConsultaIA(text: string): { eq1: string; eq2: string } | null {
  const limpio = text.replace(/ia|consultar|ia pronostico/i, '').trim();
  const regex = /([a-zA-Z\s]+?)\s+(?:vs|-|\s)\s*([a-zA-Z\s]+)/i;
  const match = limpio.match(regex);
  if (match) {
    return { eq1: match[1].trim(), eq2: match[2].trim() };
  }
  return null;
}

// =====================================================================
// FLUJO: EL ADIVINO HUMANO (Mantiene tu funcionalidad original + MongoDB)
// =====================================================================
export const adivinoFlow = addKeyword(['predigo', 'predecir', 'pronostico'])
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const message = ctx.body;
    
    const predictionText = message.replace(/predigo|predecir|pronostico/i, '').trim();
    const parsed = parsePredictionHumana(predictionText);
    
    if (!parsed) {
      const proximos = calendarService.getProximosPartidos(2);
      const partidosLista = proximos.map(p => `• ${p.team1} vs ${p.team2}`).join('\n');
      await flowDynamic(`🔮 *EL ADIVINO: TU INSTINTO* 🔮\n\nNo entendí tu marcador. Escríbelo exactamente así:\n👉 "PREDIGO Argentina 2 - 1 Brasil"\n\n📅 *Próximos partidos:*\n${partidosLista}`);
      return;
    }

    // Traducir los nombres en español ingresados por el usuario para buscar en el fixture FIFA
    const t1Ingles = traducirAIngles(parsed.team1);
    const t2Ingles = traducirAIngles(parsed.team2);

    const proximos = calendarService.getProximosPartidos(10);
    const partidoMatch = proximos.find(p => 
      (p.team1.toLowerCase() === t1Ingles.toLowerCase() && p.team2.toLowerCase() === t2Ingles.toLowerCase()) ||
      (p.team1.toLowerCase() === t2Ingles.toLowerCase() && p.team2.toLowerCase() === t1Ingles.toLowerCase())
    );

    if (!partidoMatch) {
      await flowDynamic(`❌ No encontré un partido próximo entre *${parsed.team1}* y *${parsed.team2}* en el calendario oficial.`);
      return;
    }

    // Guardar la transacción de forma ultra rápida en MongoDB NoSQL
    await MongoPrediction.create({
      phone,
      partidoId: partidoMatch.id,
      team1: parsed.team1,
      team2: parsed.team2,
      score1: parsed.score1,
      score2: parsed.score2,
      timestamp: Date.now()
    });

    const nuevaLocura = await locuraService.updateLocura(phone, 5); // +5 puntos por registrar predicción

    await flowDynamic(`🎰 *PREDICCIÓN GRABADA EN DISCO (MongoDB)* 🎰\n\n⚽ *Partido:* ${partidoMatch.team1} vs ${partidoMatch.team2}\n🎯 *Tu score:* ${parsed.team1} ${parsed.score1} - ${parsed.score2} ${parsed.team2}\n\n📈 *Bonus de locura:* +5 pts (Total: ${nuevaLocura}/100 pts)\n\n💡 _¡Tus datos servirán para reentrenar a nuestra IA al final de la jornada!_`);
  });


// =====================================================================
// FLUJO: CONSULTA ANALÍTICA IA (Invoca tu Random Forest en Español)
// =====================================================================
export const iaConsultarFlow = addKeyword(['ia', 'consultacia', 'ia_pronostico'])
  .addAction(async (ctx, { flowDynamic }) => {
    const message = ctx.body;
    const equipos = parseConsultaIA(message);

    if (!equipos) {
      await flowDynamic(`🧠 *EL CONSULTOR ANALÍTICO IA* 🧠\n\nPregúntale al Random Forest usando el comando *IA*:\n👉 "IA Colombia vs Portugal"\n👉 "IA Alemania - España"`);
      return;
    }

    await flowDynamic(`🧠 *Conectando con el Backend de Python...* ⏳\nTraduciendo y procesando Big Data para *${equipos.eq1}* vs *${equipos.eq2}*...`);

    // Traducir las entradas en castellano al inglés nativo que entiende FastAPI
    const eq1Ingles = traducirAIngles(equipos.eq1);
    const eq2Ingles = traducirAIngles(equipos.eq2);

    // Consumir el servicio HTTP del backend
    const pronosticoIA = await locuraService.obtenerPronosticoIA(eq1Ingles, eq2Ingles);

    if (!pronosticoIA || pronosticoIA.error) {
      await flowDynamic(`❌ *Error:* No logramos obtener métricas para este emparejamiento. Asegúrate de escribir bien los países.`);
      return;
    }

    // Volver a formatear la respuesta del JSON traduciendo de vuelta los nombres al español original del usuario
    const flyerWhatsApp = `✨ *PRONÓSTICO DE LA IA DEL DT* ✨
    
⚽ *Partido:* ${equipos.eq1.toUpperCase()} vs ${equipos.eq2.toUpperCase()}

🛡️ *Doble Oportunidad:* ${pronosticoIA.doble_oportunidad.replace(eq1Ingles, equipos.eq1).replace(eq2Ingles, equipos.eq2)}
📊 *Probabilidades Netas:* ${equipos.eq1} (${pronosticoIA.probabilidad_1}%) | Empate (${pronosticoIA.probabilidad_empate}%) | ${equipos.eq2} (${pronosticoIA.probabilidad_2}%)
📈 *Más/Menos Goles:* ${pronosticoIA.mas_menos_goles}
✅ *Ambos Anotan:* ${pronosticoIA.ambos_anotan}
🎯 *Marcador Exacto:* ${pronosticoIA.marcador_exacto}

--------------------------------------------------
🤖 _Modelo Predictivo Ensamble (Random Forest)_`;

    await flowDynamic(flyerWhatsApp);
  });