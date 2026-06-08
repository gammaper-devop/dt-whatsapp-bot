import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';
import { traducirAIngles } from '../utils/countries.translator';
import { normalizeTeamName } from '../utils/normalizeTeamName';

const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

// Reutilizamos tu RegEx robusta e inmune a tildes
function parseConsultaPoisson(text: string): { eq1: string; eq2: string } | null {
  const regex = /^([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]+)\s+(?:vs|-)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]+)$/i;
  const match = text.trim().match(regex);
  if (match) {
    return { eq1: match[1].trim(), eq2: match[2].trim() };
  }
  return null;
}

export const poissonFlow = addKeyword(['solicitar_poisson_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic([
      `📊 *PREDICTOR DE POISSON (GURÚ ESTADÍSTICO)* 📊`,
      ``,
      `Calcula probabilidades científicas basadas en la distribución de Poisson, goles esperados (xG) y cuotas justas de mercado.`,
      ``,
      `✍️ *Escríbelo así:*`,
      `👉 \`Argentina vs Francia\``,
      `👉 \`México - Sudáfrica\``,
      ``,
      `_Escribe los dos equipos a analizar:_`
    ].join('\n'));
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack }) => {
    const message = ctx.body.trim();

    if (['menu', 'hola', 'ayuda', 'volver'].includes(message.toLowerCase())) {
      return;
    }

    const equipos = parseConsultaPoisson(message);

    if (!equipos) {
      return fallBack(`⚠️ *No entendí las selecciones.*\n\nEscribe los dos países separados por la palabra *vs* o por un guion.\nEjemplo: \`Argentina vs Francia\`\n\n_(O escribe *MENU* para salir)_`);
    }

    const eq1Limpio = normalizeTeamName(equipos.eq1);
    const eq2Limpio = normalizeTeamName(equipos.eq2);

    const todosLosPartidos = calendarService.getProximosPartidos(104);
    
    // Validamos la existencia real en el fixture de data/worldcup2026_spanish.json
    const partidoMatch = todosLosPartidos.find(p => {
      const p1Normalizado = normalizeTeamName(p.team1);
      const p2Normalizado = normalizeTeamName(p.team2);
      return (p1Normalizado === eq1Limpio && p2Normalizado === eq2Limpio) ||
             (p1Normalizado === eq2Limpio && p2Normalizado === eq1Limpio);
    });

    if (!partidoMatch) {
      return fallBack(`❌ *No encontré ese partido:* Asegúrate de ingresar dos selecciones oficiales que se enfrenten en el torneo.`);
    }

    // Traducimos al inglés técnico para tu script de Python ("results.csv")
    const eq1Ingles = traducirAIngles(partidoMatch.team1);
    const eq2Ingles = traducirAIngles(partidoMatch.team2);

    await flowDynamic(`🧮 *Calculando matrices de Poisson...* ⏳\nProcesando variables macroestadísticas para *${partidoMatch.team1.toUpperCase()}* vs *${partidoMatch.team2.toUpperCase()}*...`);

    // Consumimos tu nuevo backend
    const dataPoisson = await locuraService.obtenerPronosticoPoisson(eq1Ingles, eq2Ingles);

    if (!dataPoisson || dataPoisson.error) {
      await flowDynamic([
        `🤖 *ALERTA DEL SISTEMA POISSON* 🤖`,
        ``,
        `No disponemos de la densidad de datos históricos de goles necesaria para procesar la distribución de Poisson para *${partidoMatch.team1}* vs *${partidoMatch.team2}*.`,
        ``,
        `_Escribe *MENU* para intentar con otro compromiso._`
      ].join('\n'));
      return;
    }

    // Estructuramos el top de marcadores exactos que arroja tu JSON array
    const marcadoresTexto = dataPoisson.top_exact_scores
      .slice(0, 5) // Tomamos los 3 más probables para no saturar WhatsApp
      .map((m: any) => `🎯 *${m.formatted_score}:* ${m.probability_percent}%`)
      .join('\n');

    // Mapeamos el flyer con tu nueva estructura JSON
    const flyerPoisson = [
      `📊 *INFORME CIENTÍFICO DE POISSON* 📊`,
      `───────────────────────`,
      `⚽ *Partido:* ${partidoMatch.team1.toUpperCase()} vs ${partidoMatch.team2.toUpperCase()}`,
      `───────────────────────`,
      ``,
      `📈 *Goles Esperados (xG):*`,
      `• *${dataPoisson.teams.home}:* ${dataPoisson.expected_goals.home.toFixed(2)} xG`,
      `• *${dataPoisson.teams.away}:* ${dataPoisson.expected_goals.away.toFixed(2)} xG`,
      ``,
      `⚖️ *Probabilidades 1X2:*`,
      `• Gana ${dataPoisson.teams.home}: ${dataPoisson.probabilities_1X2.home_win}%`,
      `• Empate: ${dataPoisson.probabilities_1X2.draw}%`,
      `• Gana ${dataPoisson.teams.away}: ${dataPoisson.probabilities_1X2.away_win}%`,
      ``,
      `🎲 *Cuotas Justas (Fair Odds):*`,
      `• Local: Local ${dataPoisson.fair_odds.home_win} | Empate: ${dataPoisson.fair_odds.draw} | Visitante: ${dataPoisson.fair_odds.away_win}`,
      ``,
      `🔥 *Top 5 Resultados Exactos Más Probables:*`,
      `${marcadoresTexto}`,
      `───────────────────────`,
      `_Escribe *MENU* para regresar al inicio._`
    ].join('\n');

    await flowDynamic(flyerPoisson);
  });