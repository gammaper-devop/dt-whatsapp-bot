import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';

const locuraService = LocuraService.getInstance();

const abuelaRespuestas: Record<string, string[]> = {
  triste: [
    "Ay mijito, no llores por un partido. El fútbol da revanchas, la vida también. ¿Te preparo unos mates virtuales? ☕",
    "Tranquilo, campeón. En el 86 también perdimos y mira después... ¡Salimos campeones!",
    "No te preocupes, cielo. Las derrotas son para aprender. ¿Querés una torta de limón? 🍰"
  ],
  frustrado: [
    "Ese árbitro no sabe nada. Debería tomarse una leche caliente con miel y relajarse.",
    "No le des bola, mijo. Los árbitros a veces no ven bien porque no quieren usar lentes.",
    "La injusticia es parte del fútbol, como el mate amargo. ¿Te sirvo uno? 🧉"
  ],
  consejo: [
    "Acordate de poner la camiseta antes del partido, que da suerte.",
    "Tomá agua mientras gritás los goles, que después te duele la garganta.",
    "Si ganamos festejamos con asado, si perdemos con pizza. Pero siempre con amor."
  ]
};

export const abuelaMundialistaFlow = addKeyword(['triste', 'perdimos', 'arbitro', 'injusticia', 'solo', 'consejo'])
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const text = ctx.body.toLowerCase();
    
    let categoria: keyof typeof abuelaRespuestas = 'consejo';
    if (text.includes('triste') || text.includes('perdimos')) categoria = 'triste';
    else if (text.includes('arbitro') || text.includes('injusticia')) categoria = 'frustrado';
    
    const respuestas = abuelaRespuestas[categoria];
    const mensajeAbuela = respuestas[Math.floor(Math.random() * respuestas.length)];
    const puntosBonus = categoria === 'triste' ? 8 : categoria === 'frustrado' ? 5 : 3;
    
    const nuevaLocura = await locuraService.updateLocura(phone, puntosBonus);
    
    await flowDynamic(`👵 *LA ABUELA MUNDIALISTA* 👵\n\n"${mensajeAbuela}"\n\n💝 *Bonus:* +${puntosBonus} pts de locura\n📈 *Tu locura ahora:* ${nuevaLocura}/100 pts`);
  });