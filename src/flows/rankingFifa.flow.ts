import { addKeyword } from "@builderbot/bot";
import * as fs from "fs";
import * as path from "path";
import { RankingFifaEquipo } from "../models/rankingFifa.model"; 
import { normalizeTeamName } from "../utils/normalizeTeamName";
import { formatDateDMY } from "../utils/formatDate"; // 🌟 Corregido alias relativo para evitar bugs en Docker

export const rankingFifaFlow = addKeyword(['ejecutar_ranking_interno'])
  .addAnswer(
    [
      "🏆 *COMPARATIVO DE RANKING FIFA 2025 - 2026* 🏆",
      "",
      "¿Qué selecciones deseas contrastar?",
      "",
      "✍️ *Escríbelo separando con un guion o un 'vs':*",
      "👉 `México - Sudáfrica`",
      "👉 `Corea del Sur vs República Checa`",
      "",
      "_Escribe los dos equipos a comparar (o *MENU* para salir):_"
    ].join("\n"),
    { capture: true },
    async (ctx, { flowDynamic, fallBack, gotoFlow }) => { // 🌟 Inyectamos fallBack y gotoFlow para control total
      try {
        const input = ctx.body.trim();

        // Cláusula de escape inmediata si el usuario se arrepiente o quiere salir
        if (['menu', 'hola', 'volver', 'ayuda'].includes(input.toLowerCase())) {
          return; // Permite que el enrutador global tome el control limpiamente
        }

        const partes = input.split(/\s+vs\s+|\s*-\s*/i);

        if (partes.length < 2) {
          // 🌟 CAMBIO: Usamos fallBack en lugar de romper el flujo para mantener el contexto vivo
          return fallBack(
            "⚠️ *Formato incorrecto.*\n\nRecuerda ingresar dos países separados por un guion (-) o un 'vs'.\nEjemplo: `Mexico - Sudafrica`\n\n_Inténtalo de nuevo (o escribe *MENU* para salir):_"
          );
        }

        // PROCESAMIENTO INTELIGENTE DE ENTRADAS CON TU UTILS
        const paisQuery1 = normalizeTeamName(partes[0]);
        const paisQuery2 = normalizeTeamName(partes[1]);

        const jsonPath = path.join(process.cwd(), "data/rankingFifa2026.json");
        
        if (!fs.existsSync(jsonPath)) {
          return await flowDynamic("❌ Error: Archivo de datos 'data/rankingFifa2026.json' no encontrado.");
        }

        const rawData = fs.readFileSync(jsonPath, "utf-8");
        const dataJson = JSON.parse(rawData);
        const equipos: RankingFifaEquipo[] = dataJson.equipos;

        // Buscamos coincidencia exacta o por inclusión sobre los nombres ya normalizados
        const equipo1 = equipos.find(e => {
          const baseName = e.pais.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return baseName.includes(paisQuery1) || paisQuery1.includes(baseName);
        });

        const equipo2 = equipos.find(e => {
          const baseName = e.pais.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return baseName.includes(paisQuery2) || paisQuery2.includes(baseName);
        });

        // 🌟 CLÁUSULA BLINDADA CON FALLBACK SI NO HAY COINCIDENCIA
        if (!equipo1 || !equipo2) {
          let errorMsg = "❌ *No se encontraron coincidencias.*\n";
          if (!equipo1) errorMsg += `\n• No detecté el primer país: "${partes[0].trim()}"`;
          if (!equipo2) errorMsg += `\n• No detecté el segundo país: "${partes[1].trim()}"`;
          errorMsg += "\n\n👉 _Por favor, introduce países válidos que participen en el Mundial (Ej: México, Canadá, Brasil, EEUU, Corea del Sur, Suiza, Sudáfrica, República Checa)._";
          errorMsg += "\n\n_Inténtalo de nuevo (o escribe *MENU* para salir):_";
          
          return fallBack(errorMsg); // 🌟 Mantiene al usuario escuchando aquí hasta que lo escriba bien
        }

        // --- CONSTRUCCIÓN DE LA TABLA COMPARATIVA EVOLUTIVA ---
        const líneasRespuesta = [
          `📊 *TABLA COMPARATIVA HISTÓRICA* 📊`,
          `⚔️ *${equipo1.pais.toUpperCase()}* vs *${equipo2.pais.toUpperCase()}*`,
          `───────────────────────`
        ];

        equipo1.historial.forEach((h1) => {
          const h2 = equipo2.historial.find(h => h.fecha === h1.fecha);

          if (h2) {
            const sign1 = h1.incremento > 0 ? "+" : "";
            const sign2 = h2.incremento > 0 ? "+" : "";

            const fechaFormateada = formatDateDMY(h1.fecha);

            líneasRespuesta.push(`📅 *Fecha:* ${fechaFormateada}`);
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
          "❌ Ocurrió un error en el motor analítico del Ranking. Regresando al menú..."
        );
      }
    }
  );