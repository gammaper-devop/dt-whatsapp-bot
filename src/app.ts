import 'dotenv/config';
import { join } from 'path';
import { createBot, createProvider, createFlow, addKeyword, utils, MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

// Importar servicios
import { LocuraService } from './services/locura.service';
import { FifaCalendarService } from './services/fifaCalendar.service';

// Importar flujos del mundial
import { welcomeFlow } from './flows/welcome.flow';
import { hinchaRecordFlow } from './flows/hinchaRecord.flow';
import { abuelaMundialistaFlow } from './flows/abuelaMundialista.flow';
import { adivinoFlow } from './flows/adivino.flow';

const PORT = process.env.PORT ?? 3008;

// Inicializar servicios globalmente (opcional pero útil)
const locuraService = new LocuraService();
const calendarService = new FifaCalendarService();

// Flujo principal que maneja el menú y comandos
const mainFlow = addKeyword<Provider, Database>(['hola', 'hello', 'hi', 'buenas', 'menu', 'ayuda'])
  .addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
    const phone = ctx.from;
    const userName = ctx.pushName || 'Fanático';
    
    // Registrar o actualizar usuario
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

⚽ *Tu nivel de locura inicial: ${user.locura}/100 pts*

*Comandos disponibles:*
• *TRIVIA* - Poné a prueba tus conocimientos
• *RANKING* - Ver la tabla de los más locos
• *TRISTE* - La abuela te consuela (cuando perdés)
• *PREDIGO ARG 2-1 BRA* - Pronosticá resultados

${partidosTexto}

🎯 *Bonus:* Mandá un *audio gritando GOOOL* para subir tu locura!`);
  });

// Flujo para manejar comandos rápidos desde cualquier conversación
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
    
    // Si no reconoce, mostrar ayuda
    await flowDynamic(`⚽ *Comandos disponibles:*\n• TRIVIA\n• RANKING\n• TRISTE\n• PREDIGO ARG 2-1 BRA\n\n*Bonus:* Enviá audio gritando GOOOL`);
  });

// Flujo para detectar audios (bonus de gol)
const audioFlow = addKeyword<Provider, Database>(utils.setEvent('AUDIO_FLOW'))
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const nuevaLocura = await locuraService.updateLocura(phone, 15);
    
    await flowDynamic(`🎉 *¡GOOOL DETECTADO!* 🎉

Tu nivel de locura subió por el audio emocionante.
📈 +15 pts de locura
🔥 *Tu nuevo nivel: ${nuevaLocura}/100 pts*

¡Así se alienta! Seguí participando en trivias y predicciones. ⚽`);
  });

const main = async () => {
  console.log('🚀 Iniciando Bot del Mundial 2026...');
  
  // Crear flujos
  const adapterFlow = createFlow([
    mainFlow,
    welcomeFlow,
    hinchaRecordFlow,
    abuelaMundialistaFlow,
    adivinoFlow,
    commandFlow,
    audioFlow
  ]);
  
  // Configurar proveedor de WhatsApp con versión específica
  const adapterProvider = createProvider(Provider, { 
    version: [2, 3000, 1035824857]  // Versión estable de WhatsApp
  });
  
  const adapterDB = new Database();
  
  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
  
  // Endpoint para enviar mensajes vía HTTP
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
  
  // Iniciar servidor HTTP en el puerto especificado
  httpServer(+PORT);
  
  console.log(`✅ Bot del Mundial corriendo en http://localhost:${PORT}`);
  console.log('📱 Escaneá el QR que aparece en la consola para conectar WhatsApp');
  console.log('\n📋 *Comandos:* TRIVIA, RANKING, TRISTE, PREDIGO ARG 2-1 BRA');
};

main().catch(console.error);