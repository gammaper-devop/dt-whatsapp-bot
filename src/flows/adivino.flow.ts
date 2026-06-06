import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { FifaCalendarService } from '../services/fifaCalendar.service';
import { traducirAIngles } from '../utils/countries.translator';
import { MongoPrediction } from '../models/mongo.schemas';
import { parsePrediction } from '../utils/parsePrediction';
import { normalizeTeamName } from '../utils/normalizeTeamName';

const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

// 🌟 FUNCIÓN EXTRACTORA IA BLINDADA CONTRA TILDES Y CARACTERES HISPANOS
function parseConsultaIA(text: string): { eq1: string; eq2: string } | null {
  // 1. Añadimos todas las vocales con tildes, eñes y diéresis (áéíóúÁÉÍÓÚñÑüÜ)
  // 2. Quitamos el signo perezoso "?" para que extraiga los nombres completos de los países
  const regex = /^([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]+)\s+(?:vs|-)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]+)$/i;
  
  const match = text.trim().match(regex);
  
  if (match) {
    return {
      eq1: match[1].trim(),
      eq2: match[2].trim()
    };
  }
  return null;
}

// =====================================================================
// OPT 3: EL ADIVINO HUMANO (Totalmente Elástico y Tolerante)
// =====================================================================
export const adivinoFlow = addKeyword(['solicitar_predigo_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    const proximos = calendarService.getProximosPartidos(3);
    const partidosLista = proximos.map(p => `• ${p.team1} vs ${p.team2}`).join('\n');

    await flowDynamic([
      `🔮 *EL ADIVINO: TU INSTINTO MUNDIALISTA* 🔮`,
      ``,
      `Ingresa tu pronóstico para cualquiera de los partidos oficiales y demuestra que eres el verdadero gurú del torneo.`,
      ``,
      `✍️ *Escríbelo como te sea más cómodo:*`,
      `👉 \`México 2 vs Sudáfrica 1\``,
      `👉 \`México 2 - 1 Sudáfrica\``,
      ``,
      `📅 *Partidos sugeridos:*`,
      `${partidosLista}`,
      ``,
      `_Escribe tu marcador ahora mismo (o *MENU* para cancelar):_`
    ].join('\n'));
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack }) => {
    const phone = ctx.from;
    const message = ctx.body.trim();

    if (['menu', 'hola', 'ayuda', 'volver'].includes(message.toLowerCase())) {
      return; 
    }

    const parsed = parsePrediction(message);
    
    if (!parsed.isValid || !parsed.team1 || !parsed.team2 || parsed.score1 === undefined || parsed.score2 === undefined) {
      return fallBack([
        `⚠️ *Formato no reconocido.*`,
        ``,
        `Por favor, asegúrate de escribir los dos países acompañados de sus respectivos goles.`,
        `Ejemplo: \`México 2 vs Sudáfrica 1\` o \`Argentina 2 - 1 Brasil\``,
        ``,
        `_Inténtalo de nuevo (o escribe *MENU* para cancelar):_`
      ].join('\n'));
    }

    const t1Ingles = traducirAIngles(parsed.team1);
    const t2Ingles = traducirAIngles(parsed.team2);

    const todosLosPartidos = calendarService.getProximosPartidos(104);
    
    const partidoMatch = todosLosPartidos.find(p => {
      const matchIngles = (p.team1.toLowerCase() === t1Ingles.toLowerCase() && p.team2.toLowerCase() === t2Ingles.toLowerCase()) ||
                          (p.team1.toLowerCase() === t2Ingles.toLowerCase() && p.team2.toLowerCase() === t1Ingles.toLowerCase());
      
      if (matchIngles) return true;

      const p1Normalizado = normalizeTeamName(p.team1);
      const p2Normalizado = normalizeTeamName(p.team2);

      return (p1Normalizado === parsed.team1 && p2Normalizado === parsed.team2) ||
             (p1Normalizado === parsed.team2 && p2Normalizado === parsed.team1);
    });

    if (!partidoMatch) {
      return fallBack([
        `❌ No encontré un partido oficial entre *${parsed.team1.toUpperCase()}* y *${parsed.team2.toUpperCase()}* en el calendario.`,
        ``,
        `👉 _Recuerda verificar que ambas selecciones se enfrenten en los grupos oficiales._`,
        ``,
        `_Inténtalo de nuevo (o escribe *MENU* para salir):_`
      ].join('\n'));
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

    await flowDynamic([
      `🎰 *¡PRONÓSTICO REGISTRADO CON ÉXITO!* 🎰`,
      ``,
      `⚽ *Partido:* ${partidoMatch.team1} vs ${partidoMatch.team2}`,
      `🎯 *Tu jugada:* ${parsed.team1.toUpperCase()} ${parsed.score1} - ${parsed.score2} ${parsed.team2.toUpperCase()}`,
      ``,
      `💡 _¡Tus datos servirán para reentrenar a nuestra IA al final de la jornada y refinar los algoritmos!_`,
      ``,
      `_Escribe *MENU* para volver al inicio._`
    ].join('\n'));
  });

// =====================================================================
// OPT 4: CONSULTA ANALÍTICA IA (Conexión con el Backend de Python)
// =====================================================================
export const iaConsultarFlow = addKeyword(['solicitar_ia_interna'])
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic(`🧠 *EL CONSULTOR ANALÍTICO IA* 🧠\n\n¿Qué partido quieres que procese el algoritmo?\n\n✍️ *Escríbelo así:*\n👉 \`Colombia vs Uzbekistán\`\n👉 \`Argentina - Argelia\`\n\n_Escribe los equipos a consultar:_`);
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

    // Al usar la nueva RegEx, equipos.eq1 será "México" y equipos.eq2 será "Sudáfrica"
    const eq1Limpio = normalizeTeamName(equipos.eq1); // "mexico"
    const eq2Limpio = normalizeTeamName(equipos.eq2); // "sudafrica"

    const todosLosPartidos = calendarService.getProximosPartidos(104);
    
    // Buscamos el partido real en el calendario
    const partidoMatch = todosLosPartidos.find(p => {
      const p1Normalizado = normalizeTeamName(p.team1);
      const p2Normalizado = normalizeTeamName(p.team2);

      return (p1Normalizado === eq1Limpio && p2Normalizado === eq2Limpio) ||
             (p1Normalizado === eq2Limpio && p2Normalizado === eq1Limpio);
    });

    if (!partidoMatch) {
      return fallBack(`❌ *No encontré ese partido:* Asegúrate de ingresar dos selecciones que se enfrenten de forma oficial en los grupos.`);
    }

    // Si el partido existe, extraemos los nombres oficiales del calendario en inglés para Python
    const eq1Ingles = traducirAIngles(partidoMatch.team1);
    const eq2Ingles = traducirAIngles(partidoMatch.team2);

    await flowDynamic(`🧠 *Conectando con el Backend de Python...* ⏳\nProcesando Big Data para *${partidoMatch.team1.toUpperCase()}* vs *${partidoMatch.team2.toUpperCase()}*...`);

    const pronosticoIA = await locuraService.obtenerPronosticoIA(eq1Ingles, eq2Ingles);

    // 🌟 MANEJO DE ERROR ELEGANTE Y FLUIDO:
    // Si Python no tiene datos para este partido específico, no frustramos al usuario.
    // Le informamos amablemente y lo invitamos a probar con otro juego volviendo al menú.
    if (!pronosticoIA || pronosticoIA.error) {
      await flowDynamic([
        `🤖 *NOTA DEL CONSULTOR IA* 🤖`,
        ``,
        `Nuestro cerebro artificial no dispone de suficientes datos históricos de enfrentamientos directos para generar un análisis predictivo confiable entre *${partidoMatch.team1}* y *${partidoMatch.team2}* en este momento.`,
        ``,
        `👉 _¡Inténtalo con otro de los partidazos de la jornada!_`,
        ``,
        `_Escribe *MENU* para volver a la lista de opciones principales._`
      ].join('\n'));
      
      return; // Finaliza el flujo limpiamente sin bucles de fallBack
    }

    const flyerWhatsApp = `✨ *PRONÓSTICO DE LA IA DEL DT* ✨
    
⚽ *Partido:* ${partidoMatch.team1.toUpperCase()} vs ${partidoMatch.team2.toUpperCase()}

🛡️ *Doble Oportunidad:* ${pronosticoIA.doble_oportunidad}
📊 *Probabilidades Netas:* ${partidoMatch.team1.toUpperCase()} (${pronosticoIA.probabilidad_1}%) | Empate (${pronosticoIA.probabilidad_empate}%) | ${partidoMatch.team2.toUpperCase()} (${pronosticoIA.probabilidad_2}%)
📈 *Más/Menos Goles:* ${pronosticoIA.mas_menos_goles}
✅ *Ambos Anotan:* ${pronosticoIA.ambos_anotan}
🎯 *Marcador Exacto:* ${pronosticoIA.marcador_exacto}

--------------------------------------------------
\n_Escribe *MENU* para regresar al menú principal._`;

    await flowDynamic(flyerWhatsApp);
  });