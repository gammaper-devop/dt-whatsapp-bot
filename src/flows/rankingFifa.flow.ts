import { addKeyword } from "@builderbot/bot";
import * as fs from "fs";
import * as path from "path";
import { RankingFifaEquipo } from "../models/rankingFifa.model"; // Ajusta la ruta según tu arquitectura de carpetas

export const rankingFifaFlow = addKeyword(['ranking', '2'])
  .addAnswer(
    [
      "🏆 *COMPARTIVO DE RANKING FIFA 2025 - 2026* 🏆",
      "",
      "¿Qué selecciones deseas contrastar?",
      "",
      "✍️ *Escríbelo separando con un guion o un 'vs':*",
      "👉 `Mexico - Sudafrica`",
      "👉 `Corea del Sur vs Republica Checa`",
      "",
      "_Escribe los dos equipos a comparar:_"
    ].join("\n"),
    { capture: true },
    async (ctx, { flowDynamic }) => {
      try {
        const input = ctx.body.trim();

        // Expresión regular para separar por "-" o por "vs" (ignorando espacios intermedios)
        const partes = input.split(/\s+vs\s+|\s*-\s*/i);

        if (partes.length < 2) {
          return await flowDynamic(
            "⚠️ *Formato incorrecto.*\nRecuerda ingresar dos países separados por un guion (-) o un 'vs'. Ejemplo: `Mexico - Sudafrica`"
          );
        }

        const paisQuery1 = partes[0].trim().toLowerCase();
        const paisQuery2 = partes[1].trim().toLowerCase();

        // Ajustamos la ruta a la subcarpeta 'data' tal como figura en tu flujo de lectura
        const jsonPath = path.join(process.cwd(), "data/rankingFifa2026.json");
        
        if (!fs.existsSync(jsonPath)) {
          return await flowDynamic("❌ Error: Archivo de datos 'data/rankingFifa2026.json' no encontrado.");
        }

        const rawData = fs.readFileSync(jsonPath, "utf-8");
        const dataJson = JSON.parse(rawData);
        const equipos: RankingFifaEquipo[] = dataJson.equipos;

        // Búsqueda elástica e inteligente de ambos equipos en el JSON
        const equipo1 = equipos.find(e => e.pais.toLowerCase().includes(paisQuery1));
        const equipo2 = equipos.find(e => e.pais.toLowerCase().includes(paisQuery2));

        if (!equipo1 || !equipo2) {
          let errorMsg = "❌ *No se encontraron coincidencias.*";
          if (!equipo1) errorMsg += `\n• No detecté el primer país: "${partes[0]}"`;
          if (!equipo2) errorMsg += `\n• No detecté el segundo país: "${partes[1]}"`;
          errorMsg += "\n\n_Intenta escribiendo los nombres sin tildes (Ej: Republica Checa, Corea del Sur, Sudafrica)._";
          return await flowDynamic(errorMsg);
        }

        // --- CONSTRUCCIÓN DE LA TABLA COMPARATIVA EVOLUTIVA ---
        const líneasRespuesta = [
          `📊 *TABLA COMPARATIVA HISTÓRICA* 📊`,
          `⚔️ *${equipo1.pais.toUpperCase()}* vs *${equipo2.pais.toUpperCase()}*`,
          `───────────────────────`
        ];

        // Usamos las fechas del primer equipo como base de tiempo para estructurar la tabla unificada
        equipo1.historial.forEach((h1) => {
          // Buscamos la fila que corresponda a la misma fecha en el segundo equipo
          const h2 = equipo2.historial.find(h => h.fecha === h1.fecha);

          if (h2) {
            // Mapeo estético de variaciones de puntos (+ o -)
            const sign1 = h1.incremento > 0 ? "+" : "";
            const sign2 = h2.incremento > 0 ? "+" : "";

            líneasRespuesta.push(`📅 *Fecha:* ${h1.fecha}`);
            líneasRespuesta.push(`• *${equipo1.pais}:* Puesto Nº${h1.puesto} | ${h1.puntaje.toFixed(1)} pts (${sign1}${h1.incremento.toFixed(1)})`);
            líneasRespuesta.push(`• *${equipo2.pais}:* Puesto Nº${h2.puesto} | ${h2.puntaje.toFixed(1)} pts (${sign2}${h2.incremento.toFixed(1)})`);
            líneasRespuesta.push(`───────────────────────`);
          }
        });

        líneasRespuesta.push("\n_Escribe *MENU* para regresar a la lista de opciones principales._");

        return await flowDynamic(líneasRespuesta.join("\n"));

      } catch (error) {
        console.error("Error en rankingFifaFlow:", error);
        return await flowDynamic(
          "❌ Ocurrió un error en el motor analítico del Ranking. Por favor, asegúrate de ingresar selecciones que pertenezcan a los grupos del Mundial."
        );
      }
    }
  );