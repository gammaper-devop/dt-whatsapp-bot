import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';

// =====================================================================
// BANCO DE PREGUNTAS EXPANDIDO (HISTORIA DE LOS MUNDIALES)
// =====================================================================
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
  },
  {
    question: "¿Qué jugador ostenta el récord de ganar más Copas del Mundo?",
    options: ["Pelé", "Maradona", "Zinedine Zidane"],
    answer: "Pelé",
    explanation: "O Rei Pelé es el único jugador en la historia que ganó 3 mundiales: 1958, 1962 y 1970."
  },
  {
    question: "¿Quién es el jugador más joven en anotar en un Mundial?",
    options: ["Kylian Mbappé", "Pelé", "Gavi"],
    answer: "Pelé",
    explanation: "Pelé anotó contra Gales en Suecia 1958 con solo 17 años y 239 días."
  },
  {
    question: "¿Qué país africano fue el primero en llegar a una semifinal en Qatar 2022?",
    options: ["Camerún", "Senegal", "Marruecos"],
    answer: "Marruecos",
    explanation: "Marruecos hizo historia al convertirse en la primera selección de África en semifinales."
  },
  {
    question: "¿Qué selección europea ganó el Mundial de Sudáfrica 2010?",
    options: ["Holanda", "España", "Alemania"],
    answer: "España",
    explanation: "España se coronó campeona por primera vez gracias al gol agónico de Andrés Iniesta en la prórroga."
  },
  {
    question: "¿En qué país se celebró el primer Mundial de la historia en 1930?",
    options: ["Argentina", "Uruguay", "Francia"],
    answer: "Uruguay",
    explanation: "Uruguay fue el anfitrión y también el primer campeón del mundo tras vencer a Argentina."
  },
  {
    question: "¿Qué histórico portero no recibió ningún gol en todo el Mundial de Alemania 2006?",
    options: ["Gianluigi Buffon", "Iker Casillas", "Pascal Zuberbühler"],
    answer: "Pascal Zuberbühler",
    explanation: "El portero de Suiza fue eliminado en octavos en penales sin haber recibido un solo gol en tiempo regular."
  },
  {
    question: "¿Quién anotó el gol de la victoria para Alemania en la final del Mundial 2014?",
    options: ["Mario Götze", "Thomas Müller", "Miroslav Klose"],
    answer: "Mario Götze",
    explanation: "Götze anotó en el minuto 113 de la prórroga asegurando el 1-0 definitivo contra Argentina."
  },
  {
    question: "¿Cuál es el jugador con más partidos jugados en la historia de los Mundiales?",
    options: ["Lothar Matthäus", "Lionel Messi", "Cristiano Ronaldo"],
    answer: "Lionel Messi",
    explanation: "Messi alcanzó los 26 partidos disputados tras jugar la gran final de Qatar 2022."
  },
  {
    question: "¿Qué país organizó el Mundial de 1994, rompiendo récords de asistencia?",
    options: ["Francia", "Estados Unidos", "Italia"],
    answer: "Estados Unidos",
    explanation: "EE.UU. 1994 promedió casi 69,000 espectadores por partido, récord vigente hasta hoy."
  },
  {
    question: "¿Qué particularidad tuvo el balón 'Jabulani' del Mundial 2010?",
    options: ["Tenía un chip interno", "Era completamente negro", "Era criticado por su trayectoria impredecible"],
    answer: "Era criticado por su trayectoria impredecible",
    explanation: "Porteros y delanteros se quejaron amargamente de sus movimientos extraños en el aire de Sudáfrica."
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
      await flowDynamic(`✅ *¡CORRECTO!* 🎉\n\n${currentTrivia.explanation}\n\n🏆 _Escribe *MENU* para regresar al inicio._`);
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