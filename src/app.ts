import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword, EVENTS, utils, MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

// Importar servicios
import { LocuraService } from './services/locura.service';
import { FifaCalendarService } from './services/fifaCalendar.service';

// Importar flujos del mundial
import { welcomeFlow } from './flows/welcome.flow';
import { hinchaRecordFlow } from './flows/hinchaRecord.flow';
import { abuelaMundialistaFlow } from './flows/abuelaMundialista.flow';
import { adivinoFlow } from './flows/adivino.flow';
import { proximosFlow, equiposFlow, calendarioFlow } from './flows/calendario.flow';

const PORT = process.env.PORT ?? 3008;

// ✅ Usar singleton para servicios
const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

// ✅ Flujo para detectar NOTAS DE VOZ
const voiceNoteFlow = addKeyword<Provider, Database>(EVENTS.VOICE_NOTE)
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    console.log(`🎙️ Nota de voz recibida de: ${phone}`);
    
    const nuevaLocura = await locuraService.updateLocura(phone, 15);
    
    await flowDynamic(`🎉 *¡GOOOL DETECTADO!* 🎉

Tu nivel de locura subió por el audio emocionante.
📈 +15 pts de locura
🔥 *Tu nuevo nivel: ${nuevaLocura}/100 pts*

¡Así se alienta! Seguí participando en trivias y predicciones. ⚽`);
  });

// ✅ Flujo alternativo para detectar cualquier MEDIA
const mediaFlow = addKeyword<Provider, Database>(EVENTS.MEDIA)
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const message = ctx.message as any;
    
    console.log(`📦 EVENTO MEDIA recibido de: ${phone}`);
    console.log(`📦 Tipo de mensaje: ${JSON.stringify(Object.keys(message?.message || {}))}`);
    
    // Verificar si es una nota de voz (audioMessage) o documento de audio
    const isVoiceNote = message?.message?.audioMessage !== undefined;
    const isAudioDoc = message?.message?.documentMessage?.mimetype?.includes('audio');
    
    if (!isVoiceNote && !isAudioDoc) {
      console.log(`⏭️ No es audio, ignorando`);
      return;
    }
    
    console.log(`🎵 AUDIO detectado! Nota de voz: ${isVoiceNote}, Documento: ${isAudioDoc}`);
    
    const nuevaLocura = await locuraService.updateLocura(phone, 15);
    
    await flowDynamic(`🎉 *¡GOOOL DETECTADO!* 🎉

Tu nivel de locura subió por el audio emocionante.
📈 +15 pts de locura
🔥 *Tu nuevo nivel: ${nuevaLocura}/100 pts*

¡Así se alienta! Seguí participando en trivias y predicciones. ⚽`);
  });

// Flujo principal
const mainFlow = addKeyword<Provider, Database>(['hola', 'hello', 'hi', 'buenas', 'menu', 'ayuda'])
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const userName = ctx.pushName || 'Fanático';
    
    const user = await locuraService.getUser(phone);
    if (user.name === phone.slice(-8)) {
      user.name = userName;
      await locuraService.updateUser(phone, user);
    }
    
    const proximosPartidos = calendarService.getProximosPartidos(3);
    const partidosTexto = proximosPartidos.length > 0 
      ? `\n📅 *Próximos partidos:*\n${proximosPartidos.map(p => `• ${p.team1} vs ${p.team2} (${p.date})`).join('\n')}`
      : '';
    
    await flowDynamic(`🎉 *¡BIENVENIDO AL TERMÓMETRO DEL MUNDIAL, ${userName.toUpperCase()}!* 🎉

Yo soy *El DT*, tu asistente de emociones futboleras.

⚽ *Tu nivel de locura: ${user.locura}/100 pts*

*Comandos disponibles:*
• *TRIVIA* - Poné a prueba tus conocimientos 🧠
• *RANKING* - Ver la tabla de los más locos 🏆
• *TRISTE* - La abuela te consuela 👵
• *PREDIGO ARG 2-1 BRA* - Pronosticá resultados 🔮
• *PROXIMOS* - Próximos partidos ⚽
• *EQUIPOS* - Todas las selecciones 🌍
• *CALENDARIO* - Partidos completos 📅

${partidosTexto}

🎯 *Bonus:* Mandá un *audio gritando GOOOL* para subir tu locura! 🎙️`);
  });

// Flujo para manejar comandos rápidos
const commandFlow = addKeyword<Provider, Database>(utils.setEvent('COMMAND_FLOW'))
  .addAction(async (ctx, { gotoFlow, flowDynamic }) => {
    const bodyText = ctx.body.toLowerCase();
    
    if (bodyText === 'trivia' || bodyText === 'ranking') {
      return gotoFlow(hinchaRecordFlow);
    }
    
    if (['triste', 'perdimos', 'arbitro', 'injusticia', 'solo', 'consejo'].some(c => bodyText.includes(c))) {
      return gotoFlow(abuelaMundialistaFlow);
    }
    
    if (bodyText.includes('predigo') || bodyText.includes('predecir') || bodyText.includes('pronostico')) {
      return gotoFlow(adivinoFlow);
    }
    
    if (bodyText === 'proximos' || bodyText === 'próximos') {
      return gotoFlow(proximosFlow);
    }
    
    if (bodyText === 'equipos' || bodyText === 'selecciones') {
      return gotoFlow(equiposFlow);
    }
    
    if (bodyText === 'calendario' || bodyText === 'fixture') {
      return gotoFlow(calendarioFlow);
    }
    
    await flowDynamic(`⚽ *Comandos disponibles:*\n• TRIVIA\n• RANKING\n• TRISTE\n• PREDIGO\n• PROXIMOS\n• EQUIPOS\n• CALENDARIO\n\n🎯 *Bonus:* Enviá audio gritando GOOOL (+15 pts)`);
  });

// Flujo de audio por evento manual (respaldo)
const audioFlow = addKeyword<Provider, Database>(utils.setEvent('AUDIO_FLOW'))
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const nuevaLocura = await locuraService.updateLocura(phone, 15);
    
    await flowDynamic(`🎉 *¡GOOOL DETECTADO!* 🎉

📈 +15 pts de locura
🔥 *Tu nuevo nivel: ${nuevaLocura}/100 pts*`);
  });

const main = async () => {
  console.log('🚀 Iniciando Bot del Mundial 2026...');
  
  const adapterFlow = createFlow([
    mainFlow,
    welcomeFlow,
    hinchaRecordFlow,
    abuelaMundialistaFlow,
    adivinoFlow,
    proximosFlow,
    equiposFlow,
    calendarioFlow,
    commandFlow,
    voiceNoteFlow,
    mediaFlow,
    audioFlow
  ]);
  
  const adapterProvider = createProvider(Provider, { 
    version: [2, 3000, 1035824857]
  });
  
  const adapterDB = new Database();
  
  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
  
  adapterProvider.server.post(
    '/v1/messages',
    handleCtx(async (bot, req, res) => {
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end('Mensaje enviado');
    })
  );
  
  adapterProvider.server.get(
    '/v1/ranking',
    handleCtx(async (bot, req, res) => {
      const ranking = await locuraService.getRanking(10);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', ranking }));
    })
  );
  
  httpServer(+PORT);
  
  console.log(`✅ Bot del Mundial corriendo en http://localhost:${PORT}`);
  console.log('📱 Escaneá el QR para conectar WhatsApp');
  console.log('\n📋 *Comandos:* TRIVIA, RANKING, TRISTE, PREDIGO, PROXIMOS, EQUIPOS, CALENDARIO');
  console.log('🎙️ *Bonus:* Enviá audio gritando GOOOL (+15 pts)');
};

main().catch(console.error);