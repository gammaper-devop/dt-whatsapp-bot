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

// =====================================================================
// OPT 3: LA ABUELA MUNDIALISTA (Inmune a cascadas)
// =====================================================================
export const abuelaMundialistaFlow = addKeyword(['solicitar_abuela_interna'])
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic(`👵 *LA ABUELA MUNDIALISTA* 👵\n\nHola mi cielo, ¿cómo te sentís hoy con los resultados del Mundial?\n\n1. Me siento *TRISTE* o perdimos 😢\n2. Estoy *ENOJADO* con el árbitro o hubo injusticia 😡\n3. Solo quiero un *CONSEJO* de la abuela 👵\n\n_Responde con el número de tu estado de ánimo (o escribe *MENU* para salir):_`);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack }) => {
    const phone = ctx.from;
    const opcion = ctx.body.trim().toLowerCase();

    if (['menu', 'hola', 'volver'].includes(opcion)) return;

    let categoria: keyof typeof abuelaRespuestas = 'consejo';
    let puntosBonus = 3;

    if (opcion === '1' || opcion.includes('triste') || opcion.includes('perdimos')) {
      categoria = 'triste';
      puntosBonus = 8;
    } else if (opcion === '2' || opcion.includes('arbitro') || opcion.includes('enojado') || opcion.includes('injusticia')) {
      categoria = 'frustrado';
      puntosBonus = 5;
    } else if (opcion === '3' || opcion.includes('consejo')) {
      categoria = 'consejo';
      puntosBonus = 3;
    } else {
      return fallBack(`👵 "Mijo, no te entendí bien. Dime *1*, *2* o *3* para saber cómo consentirte, o escribe *MENU* para irte con tus amigos."`);
    }

    const respuestas = abuelaRespuestas[categoria];
    const mensajeAbuela = respuestas[Math.floor(Math.random() * respuestas.length)];
    
    const nuevaLocura = await locuraService.updateLocura(phone, puntosBonus);
    
    await flowDynamic(`👵 *LA ABUELA MUNDIALISTA* 👵\n\n"${mensajeAbuela}"\n\n💝 *Bonus:* +${puntosBonus} pts de locura\n📈 *Tu locura ahora:* ${nuevaLocura}/100 pts\n\n_Escribe *MENU* para volver al menú principal._`);
  });