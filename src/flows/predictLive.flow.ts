import { addKeyword } from '@builderbot/bot';
import axios from 'axios';
import { normalizeTeamName } from '../utils/normalizeTeamName';
import { PredictLiveResponse } from '../models/predictLive.model';

function parseConsultaLive(text: string): { eq1: string; eq2: string } | null {
  const regex = /^([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]+)\s+(?:vs|-)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]+)$/i;
  const match = text.trim().match(regex);
  if (match) {
    return { eq1: match[1].trim(), eq2: match[2].trim() };
  }
  return null;
}

export const predictLiveFlow = addKeyword(['solicitar_live_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic([
      `📊 *ANÁLISIS EN VIVO (MÉTRICAS DEL TORNEO)* 📊`,
      ``,
      `Calcula probabilidades avanzadas cruzando el xG real acumulado en este torneo actual y el histórico.`,
      ``,
      `✍️ *Escríbelo así para ejecutar la IA:*`,
      `👉 \`Alemania vs Curazao\``,
      `👉 \`México vs Corea del Sur\``,
      ``,
      `_Escribe los dos equipos separados por un 'vs' (o escribe *MENU* para cancelar):_`
    ].join('\n'));
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack }) => {
    const input = ctx.body.trim();

    if (['menu', 'hola', 'volver', 'ayuda', 'hi', 'hello'].includes(input.toLowerCase())) {
      return;
    }

    const partidoMatch = parseConsultaLive(input);

    if (!partidoMatch) {
      return fallBack(`⚠️ *Formato incorrecto.* Por favor, escribe los dos equipos usando un *vs* de por medio.\n\nEjemplo: \`Alemania vs Curazao\``);
    }

    const localNormalizado = normalizeTeamName(partidoMatch.eq1);
    const visitanteNormalizado = normalizeTeamName(partidoMatch.eq2);

    const nombreFormateadoLocal = localNormalizado.charAt(0).toUpperCase() + localNormalizado.slice(1);
    const nombreFormateadoVisitante = visitanteNormalizado.charAt(0).toUpperCase() + visitanteNormalizado.slice(1);

    await flowDynamic(`🤖 *Consultando big data del torneo en vivo...* ⏳`);

    try {
      const response = await axios.post<PredictLiveResponse>('http://127.0.0.1:5002/api/v1/predict-live', {
        home_team: nombreFormateadoLocal,
        away_team: nombreFormateadoVisitante
      });

      const data = response.data;

        // 🎯 Ahora toma el Top 5 de marcadores mas probables
        const marcadoresFormateados = data.marcadores_mas_probables
            .slice(0, 5) // Nos aseguramos de capturar hasta 5 elementos
            .map((m, index) => {
            const medallas = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
            const emoji = medallas[index] || '📌';
            return `${emoji}  *${m.score}* (Probabilidad: ${(m.prob * 100).toFixed(1)}%)`;
            })
        .join('\n');

        let analisisCuotaReal = data.analisis_cuota;
        analisisCuotaReal = analisisCuotaReal
          .replace(/Local/i, nombreFormateadoLocal)
          .replace(/Visitante/i, nombreFormateadoVisitante);
  
        const flyerLive = [
          `🔮 *PRONÓSTICO DE IA (LIVE IN-PLAY)* ⚽`,
          `───────────────────────`,
          `⚔️ *Encuentro:* ${nombreFormateadoLocal.toUpperCase()} vs ${nombreFormateadoVisitante.toUpperCase()}`,
          `📊 *Método:* ${data.metodo}`,
          `───────────────────────`,
          ``,
          `📈 *Probabilidades Netas 1X2:*`,
          `• Gana ${nombreFormateadoLocal}: *${data.probabilidades_1X2.gana_local}%* 🏠`,
          `• Empate (X): *${data.probabilidades_1X2.empate}%* 🤝`,
          `• Gana ${nombreFormateadoVisitante}: *${data.probabilidades_1X2.gana_visitante}%* 🚀`,
          ``,
          `🎯 *Top 5 Marcadores más Probables:*`,
          marcadoresFormateados,
          ``,
          `🔥 *Análisis de Cuota Sugerido:*`,
          `👉 *${analisisCuotaReal}*`,
          `───────────────────────`,
          ``,
          `_Escribe *MENU* para regresar a las opciones._`
        ].join('\n');

      await flowDynamic(flyerLive);

    } catch (error: any) {
      await flowDynamic(`❌ *Error:* No pudimos procesar la simulación para *${nombreFormateadoLocal} vs ${nombreFormateadoVisitante}* en el puerto 5002.`);
    }
  });