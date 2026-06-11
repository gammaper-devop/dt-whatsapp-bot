import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';
import { traducirAIngles } from '../utils/countries.translator';
import { normalizeTeamName } from '../utils/normalizeTeamName';

const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

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
      `📊 *CÁLCULO MATEMÁTICO (MODELO POISSON)* 📊`,
      ``,
      `Calcula probabilidades estadísticas basadas en goles esperados (xG), rendimiento histórico y cuotas justas de mercado.`,
      ``,
      `✍️ *Escríbelo así:*`,
      `👉 \`Bélgica vs Irán\``,
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
      return fallBack(`⚠️ *No entendí las selecciones.*\n\nEscribe los dos países separados por la palabra *vs* o por un guion.\nEjemplo: \`Bélgica vs Irán\`\n\n_(O escribe *MENU* para salir)_`);
    }

    const eq1Limpio = normalizeTeamName(equipos.eq1);
    const eq2Limpio = normalizeTeamName(equipos.eq2);

    // const todosLosPartidos = calendarService.getProximosPartidos(104);
    const todosLosPartidos = calendarService.getTodosLosPartidosRaw();
    
    // Buscamos el partido en tu JSON local en español (data/worldcup2026_spanish.json)
    const partidoMatch = todosLosPartidos.find(p => {
      const p1Normalizado = normalizeTeamName(p.team1);
      const p2Normalizado = normalizeTeamName(p.team2);
      return (p1Normalizado === eq1Limpio && p2Normalizado === eq2Limpio) ||
             (p1Normalizado === eq2Limpio && p2Normalizado === eq1Limpio);
    });

    if (!partidoMatch) {
      return fallBack(`❌ *No encontré ese partido:* Asegúrate de ingresar dos selecciones oficiales que se enfrenten en el torneo.`);
    }

    // Obtenemos los nombres oficiales en español directo del calendario local
    const nombreEspLocal = partidoMatch.team1; // Ej: "Bélgica"
    const nombreEspVisita = partidoMatch.team2; // Ej: "Irán"

    // Traducimos al inglés técnico para cumplir con el payload que espera tu API de Python
    let eq1Ingles = traducirAIngles(nombreEspLocal); // "Belgium"
    let eq2Ingles = traducirAIngles(nombreEspVisita); // "Iran"

    // Conversión en caliente de ampersand por si acaso
    if (eq1Ingles.includes("&")) eq1Ingles = eq1Ingles.replace("&", "and");
    if (eq2Ingles.includes("&")) eq2Ingles = eq2Ingles.replace("&", "and");

    await flowDynamic(`🧮 *Calculando matrices de Poisson...* ⏳\nProcesando variables estadísticas para *${nombreEspLocal.toUpperCase()}* vs *${nombreEspVisita.toUpperCase()}*...`);

    const dataPoisson = await locuraService.obtenerPronosticoPoisson(eq1Ingles, eq2Ingles);

    if (!dataPoisson || dataPoisson.error) {
      await flowDynamic([
        `🤖 *ALERTA DEL SISTEMA POISSON* 🤖`,
        ``,
        `No disponemos de la densidad de datos históricos necesaria para procesar la distribución de Poisson para *${nombreEspLocal}* vs *${nombreEspVisita}*.`,
        ``,
        `_Escribe *MENU* para intentar con otro compromiso._`
      ].join('\n'));
      return;
    }

    // 🌟 FORMATEADOR DE MARCADORES EXACTOS AL CASTELLANO
    // Mapea y traduce cadenas del estilo "Belgium 2 - 1 Iran" a "Bélgica 2 - 1 Irán" usando los nombres locales
    const marcadoresTexto = dataPoisson.top_exact_scores
      .slice(0, 5) // Muestra el Top 5 exacto solicitado
      .map((m: any) => {
        let scoreTraducido = m.formatted_score;
        // Reemplazamos los nombres en inglés que vienen de Python por los nombres reales en español
        scoreTraducido = scoreTraducido.replace(eq1Ingles, nombreEspLocal).replace(eq2Ingles, nombreEspVisita);
        return `🎯 *${scoreTraducido}:* ${m.probability_percent.toFixed(2)}%`;
      })
      .join('\n');

    // 🌟 UNIFICACIÓN TOTAL AL ESPAÑOL
    const flyerPoisson = [
      `📊 *INFORME CIENTÍFICO DE POISSON* 📊`,
      `───────────────────────`,
      `⚽ *Partido:* ${nombreEspLocal.toUpperCase()} vs ${nombreEspVisita.toUpperCase()}`,
      `───────────────────────`,
      ``,
      `📈 *Goles Esperados (xG):*`,
      `• *${nombreEspLocal}:* ${dataPoisson.expected_goals.home.toFixed(2)} xG`,
      `• *${nombreEspVisita}:* ${dataPoisson.expected_goals.away.toFixed(2)} xG`,
      ``,
      `⚖️ *Probabilidades 1X2:*`,
      `• Gana *${nombreEspLocal}*: ${dataPoisson.probabilities_1X2.home_win.toFixed(2)}%`,
      `• *Empate*: ${dataPoisson.probabilities_1X2.draw.toFixed(2)}%`,
      `• Gana *${nombreEspVisita}*: ${dataPoisson.probabilities_1X2.away_win.toFixed(2)}%`,
      ``,
      `🎲 *Cuotas Justas:*`,
      `• *${nombreEspLocal}*: ${dataPoisson.fair_odds.home_win.toFixed(2)}`,
      `• *Empate*: ${dataPoisson.fair_odds.draw.toFixed(2)}`,
      `• *${nombreEspVisita}*: ${dataPoisson.fair_odds.away_win.toFixed(2)}`,
      ``,
      `🔥 *Top 5 Resultados Exactos Más Probables:*`,
      `${marcadoresTexto}`,
      `───────────────────────`,
      `_Escribe *MENU* para regresar al inicio._`
    ].join('\n');

    await flowDynamic(flyerPoisson);
  });