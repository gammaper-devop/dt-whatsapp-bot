import { addKeyword } from "@builderbot/bot";
import * as fs from "fs";
import * as path from "path";
import { RankingFifaEquipo } from "../models/rankingFifa.model";
// =====================================================================
// OPT 2: RANKING FIFA 2026
// =====================================================================
export const rankingFifaFlow = addKeyword(['solicitar_rankingFifa'])
  .addAnswer(
    "🏆 Por favor, escribe el **nombre del país** que deseas consultar en el Ranking FIFA 2026:",
    { capture: true },
    async (ctx, { flowDynamic }) => {
      try {
        const queryPais = ctx.body.trim().toLowerCase();

        // Ruta al archivo JSON en tu proyecto
        const jsonPath = path.join(process.cwd(), "data/rankingFifa2026.json");
        
        if (!fs.existsSync(jsonPath)) {
          return await flowDynamic("⚠️ Error: Archivo 'rankingFifa2026.json' no encontrado.");
        }

        const rawData = fs.readFileSync(jsonPath, "utf-8");
        const dataJson = JSON.parse(rawData);
        const equipos: RankingFifaEquipo[] = dataJson.equipos; // Accedemos al array 'equipos' de tu JSON[cite: 6, 9]

        // Buscamos la posición (índice) para saber el puesto en el ranking mundial
        const index = equipos.findIndex(
          (e) => e.pais.toLowerCase().includes(queryPais)
        );

        if (index === -1) {
          return await flowDynamic(
            `❌ No se encontró la selección "${ctx.body}". Intenta escribirlo sin tildes (Ej: Mexico, Paises Bajos, Canada).`
          );
        }

        const seleccion = equipos[index];
        
        // Formatear el incremento con su signo correspondiente
        const signoIncremento = seleccion.incremento > 0 ? "+" : "";

        // Construcción del mensaje con tus datos reales[cite: 6]
        const respuesta = [
          `🏅 *RANKING FIFA MUNDIAL 2026* 🏅`,
          `───────────────────────`,
          `🌍 *Selección:* ${seleccion.pais}`,
          `📊 *Puntaje:* ${seleccion.puntaje.toFixed(2)} pts`,
          `📈 *Variación:* ${signoIncremento}${seleccion.incremento.toFixed(2)} pts`,
          `───────────────────────`,
          `\n_Escribe *MENU* para regresar al menú principal._`
        ].join("\n");

        return await flowDynamic(respuesta);

      } catch (error) {
        console.error("Error en rankingFifaFlow:", error);
        return await flowDynamic("❌ Ocurrió un error al consultar el ranking. Inténtalo de nuevo.");
      }
    }
  );