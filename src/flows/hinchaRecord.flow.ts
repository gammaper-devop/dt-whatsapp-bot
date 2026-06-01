import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';

// Banco de preguntas expandido
const triviaQuestions = [
  {
    question: "¿Quién ganó el Mundial 2018?",
    options: ["Francia", "Croacia", "Bélgica"],
    answer: "Francia",
    explanation: "Francia venció 4-2 a Croacia en la final de Rusia 2018."
  },
  {
    question: "¿Cuál es el máximo goleador histórico de los mundiales?",
    options: ["Miroslav Klose", "Ronaldo", "Messi"],
    answer: "Miroslav Klose",
    explanation: "Klose anotó 16 goles en 4 mundiales (2002-2014)."
  },
  {
    question: "¿Qué selección tiene más títulos mundiales?",
    options: ["Alemania", "Italia", "Brasil"],
    answer: "Brasil",
    explanation: "Brasil ganó 5 mundiales (1958, 1962, 1970, 1994, 2002)."
  },
  {
    question: "¿En qué Mundial Diego Maradona anotó el 'Gol del Siglo' contra Inglaterra?",
    options: ["España 1982", "México 1986", "Italia 1990"],
    answer: "México 1986",
    explanation: "Fue en los cuartos de final de México 1986 en el Estadio Azteca."
  },
  {
    question: "¿Qué país será el anfitrión de la gran final del Mundial 2026?",
    options: ["México", "Canadá", "Estados Unidos"],
    answer: "Estados Unidos",
    explanation: "La final se jugará en el MetLife Stadium de Nueva Jersey, Estados Unidos."
  }
];

const locuraService = LocuraService.getInstance();

// =====================================================================
// OPT 1: TRIVIA INTERACTIVA (Validador Dinámico Híbrido)
// =====================================================================
export const hinchaRecordFlow = addKeyword(['solicitar_trivia_interna'])
  .addAction(async (ctx, { flowDynamic, state }) => {
    // Seleccionar pregunta aleatoria
    const randomTrivia = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    await state.update({ currentTrivia: randomTrivia });
    
    const msg = `📊 *HINCHA RÉCORD - TRIVIA* 📊\n\n${randomTrivia.question}\n\n${randomTrivia.options.map((opt, i) => `${i+1}️⃣ ${opt}`).join('\n')}\n\n💡 *¿Cómo responder?*\nPuedes escribir el *NÚMERO* de la opción o el *TEXTO* de la respuesta.\n\n_(O escribe *MENU* para salir)_`;
    await flowDynamic(msg);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, fallBack }) => {
    const phone = ctx.from;
    const incomingText = ctx.body.trim().toLowerCase();
    const currentTrivia = state.get('currentTrivia');
    
    if (!currentTrivia) return;

    // Cláusula de escape
    if (['menu', 'hola', 'volver'].includes(incomingText)) {
      return;
    }

    let isCorrect = false;
    const numericAnswer = parseInt(incomingText);

    // VALIDADOR DINÁMICO HÍBRIDO
    if (!isNaN(numericAnswer) && numericAnswer >= 1 && numericAnswer <= currentTrivia.options.length) {
      // 1. Validación por número
      const selectedOption = currentTrivia.options[numericAnswer - 1];
      isCorrect = selectedOption.toLowerCase() === currentTrivia.answer.toLowerCase();
    } else {
      // 2. Validación por texto (ignora mayúsculas/minúsculas y acentos básicos)
      isCorrect = incomingText === currentTrivia.answer.toLowerCase() || 
                  currentTrivia.options.some(opt => opt.toLowerCase() === incomingText && opt.toLowerCase() === currentTrivia.answer.toLowerCase());
    }

    // Si la entrada no coincide ni con un número válido ni con texto coherente del pool, pedimos reintento
    const opcionesValidasTexto = currentTrivia.options.map(o => o.toLowerCase());
    const esEntradaValida = (!isNaN(numericAnswer) && numericAnswer >= 1 && numericAnswer <= currentTrivia.options.length) || 
                            opcionesValidasTexto.includes(incomingText);

    if (!esEntradaValida) {
      return fallBack(`⚠️ *Respuesta no reconocida.*\n\nPor favor, ingresa un número (1, 2 o 3) o escribe textualmente una de las opciones.\n\n_(O escribe *MENU* para cancelar)_`);
    }
    
    if (isCorrect) {
      const nuevaLocura = await locuraService.updateLocura(phone, 10);
      await flowDynamic(`✅ *¡CORRECTO!* 🎉\n\n${currentTrivia.explanation}\n\n🏆 Ganaste +10 pts de locura.\n📈 Tu nuevo nivel: ${nuevaLocura}/100 pts\n\n_Escribe *MENU* para regresar al inicio._`);
    } else {
      await flowDynamic(`❌ *INCORRECTO*\n\nLa respuesta correcta era: *${currentTrivia.answer}*\n${currentTrivia.explanation}\n\n_Escribe *MENU* para volver al inicio._`);
    }
    
    await state.update({ currentTrivia: null });
  });

// =====================================================================
// OPT 2: RANKING INDEPENDIENTE
// =====================================================================
export const rankingFlow = addKeyword(['solicitar_ranking_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    const ranking = await locuraService.getRanking(10);
    
    if (ranking.length === 0) {
      await flowDynamic(`🏆 *RANKING DE LOCURA MUNDIALISTA* 🏆\n\nAún no hay usuarios en el ranking.\n¡Sé el primero en participar!`);
      return;
    }
    
    let rankingMsg = '🏆 *RANKING DE LOCURA MUNDIALISTA* 🏆\n\n';
    ranking.forEach((u, i) => {
      const medalla = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
      // Muestra el nombre real si ya lo cambió, de lo contrario su alias de Fanático
      const nombreMostrar = u.name && !u.name.includes(u.phone.slice(-4)) ? u.name : `Fanático ${u.phone.slice(-4)}`;
      rankingMsg += `${medalla} ${i+1}. *${nombreMostrar}* - ${u.locura} pts\n`;
    });
    
    rankingMsg += `\n💡 *Tip:* Participa en trivias y predicciones para subir.\n\n_Escribe *MENU* para regresar._`;
    await flowDynamic(rankingMsg);
  });