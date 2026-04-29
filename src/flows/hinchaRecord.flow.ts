import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';

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
  }
];

export const hinchaRecordFlow = addKeyword(['trivia', 'ranking'])
  .addAction(async (ctx, { flowDynamic, state }) => {
    const phone = ctx.from;
    const locuraService = new LocuraService();
    
    if (ctx.body.toLowerCase() === 'ranking') {
      const ranking = await locuraService.getRanking(5);
      const rankingMsg = ranking.map((u, i) => `${i+1}. ${u.name} - ${u.locura} pts`).join('\n');
      await flowDynamic(`🏆 *RANKING DE LOCURA* 🏆\n\n${rankingMsg}`);
      return;
    }
    
    const randomTrivia = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    await state.update({ currentTrivia: randomTrivia });
    
    const msg = `📊 *HINCHA RÉCORD - TRIVIA* 📊\n\n${randomTrivia.question}\n\n${randomTrivia.options.map((opt, i) => `${i+1}. ${opt}`).join('\n')}\n\nRespondé con el NÚMERO de la opción correcta (+10 pts de locura)`;
    await flowDynamic(msg);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
    const phone = ctx.from;
    const answer = parseInt(ctx.body.trim());
    const locuraService = new LocuraService();
    const currentTrivia = state.get('currentTrivia');
    
    if (!currentTrivia) return;
    
    const selectedOption = currentTrivia.options[answer - 1];
    const isCorrect = selectedOption === currentTrivia.answer;
    
    if (isCorrect) {
      const nuevaLocura = await locuraService.updateLocura(phone, 10);
      await flowDynamic(`✅ *¡CORRECTO!*\n\n${currentTrivia.explanation}\n🎉 Ganaste +10 pts de locura.\n📈 Tu nuevo nivel: ${nuevaLocura}/100 pts`);
    } else {
      await flowDynamic(`❌ *INCORRECTO*\n\nLa respuesta era: ${currentTrivia.answer}\n${currentTrivia.explanation}\n\nNo te desanimes, ¡volvé a intentarlo con otro "TRIVIA"!`);
    }
    
    await state.update({ currentTrivia: null });
  });