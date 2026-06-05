import { addKeyword } from "@builderbot/bot";
import * as fs from "fs";
import * as path from "path";
import { RankingFifaEquipo } from "../models/rankingFifa.model"; 
import { normalizeTeamName } from "../utils/normalizeTeamName";
import { formatDateDMY } from "~/utils/formatDate";

export const rankingFifaFlow = addKeyword(['ejecutar_ranking_interno'])
  .addAnswer(
    [
      "🏆 *COMPARATIVO DE RANKING FIFA 2025 - 2026* 🏆",
      "",
      "¿Qué selecciones deseas contrastar?",
      "",
      "✍️ *Escríbelo separando con un guion o un 'vs':*",
      "👉 `México - Sudáfrica`",
      "👉 `Corea del Sur vs Republia Checa`",
      "",
      "_Escribe los dos equipos a comparar:_"
    ].join("\n"),
    { capture: true },
    async (ctx, { flowDynamic }) => {
      try {
        const input = ctx.body.trim();
        const partes = input.split(/\s+vs\s+|\s*-\s*/i);

        if (partes.length < 2) {
          return await flowDynamic(
            "⚠️ *Formato incorrecto.*\nRecuerda ingresar dos países separados por un guion (-) o un 'vs'. Ejemplo: `Mexico - Sudafrica`"
          );
        }

        // 🌟 PROCESAMIENTO INTELIGENTE DE ENTRADAS CON TU UTILS
        const paisQuery1 = normalizeTeamName(partes[0]);
        const paisQuery2 = normalizeTeamName(partes[1]);

        const jsonPath = path.join(process.cwd(), "data/rankingFifa2026.json"); //
        
        if (!fs.existsSync(jsonPath)) { //
          return await flowDynamic("❌ Error: Archivo de datos 'data/rankingFifa2026.json' no encontrado."); //
        }

        const rawData = fs.readFileSync(jsonPath, "utf-8"); //
        const dataJson = JSON.parse(rawData); //
        const equipos: RankingFifaEquipo[] = dataJson.equipos; //

        // Buscamos coincidencia exacta o por inclusión sobre los nombres ya normalizados de la base de datos
        const equipo1 = equipos.find(e => {
          const baseName = e.pais.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return baseName.includes(paisQuery1) || paisQuery1.includes(baseName);
        });

        const equipo2 = equipos.find(e => {
          const baseName = e.pais.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return baseName.includes(paisQuery2) || paisQuery2.includes(baseName);
        });

        if (!equipo1 || !equipo2) {
          let errorMsg = "❌ *No se encontraron coincidencias.*";
          if (!equipo1) errorMsg += `\n• No detecté el primer país: "${partes[0]}"`;
          if (!equipo2) errorMsg += `\n• No detecté el segundo país: "${partes[1]}"`;
          errorMsg += "\n\n_Intenta verificar cómo escribiste las selecciones._";
          return await flowDynamic(errorMsg);
        }

        // --- CONSTRUCCIÓN DE LA TABLA COMPARATIVA EVOLUTIVA ---
        const líneasRespuesta = [
          `📊 *TABLA COMPARATIVA HISTÓRICA* 📊`, //
          `⚔️ *${equipo1.pais.toUpperCase()}* vs *${equipo2.pais.toUpperCase()}*`, //
          `───────────────────────` //
        ];

        equipo1.historial.forEach((h1) => { //
          const h2 = equipo2.historial.find(h => h.fecha === h1.fecha); //

          if (h2) { //
            const sign1 = h1.incremento > 0 ? "+" : ""; //
            const sign2 = h2.incremento > 0 ? "+" : ""; //

            const fechaFormateada = formatDateDMY(h1.fecha);

            líneasRespuesta.push(`📅 *Fecha:* ${fechaFormateada}`); //
            líneasRespuesta.push(`• *${equipo1.pais}:* Puesto Nº${h1.puesto} | ${h1.puntaje.toFixed(1)} pts (${sign1}${h1.incremento.toFixed(1)})`); //
            líneasRespuesta.push(`• *${equipo2.pais}:* Puesto Nº${h2.puesto} | ${h2.puntaje.toFixed(1)} pts (${sign2}${h2.incremento.toFixed(1)})`); //
            líneasRespuesta.push(`───────────────────────`); //
          }
        });

        líneasRespuesta.push("\n_Escribe *MENU* para regresar a la lista de opciones principales._"); //

        return await flowDynamic(líneasRespuesta.join("\n")); //

      } catch (error) {
        console.error("Error en rankingFifaFlow:", error); //
        return await flowDynamic(
          "❌ Ocurrió un error en el motor analítico del Ranking. Por favor, asegúrate de ingresar selecciones que pertenezcan a los grupos del Mundial." //
        );
      }
    }
  );