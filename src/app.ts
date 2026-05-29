import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword, utils, MemoryDB as Database } from '@builderbot/bot';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';

// Importar servicios
import { LocuraService } from './services/locura.service';
import { FifaCalendarService } from './services/fifaCalendar.service';

// Importar MongoDB
import mongoose from 'mongoose';

// Importar flujos del mundial
import { welcomeFlow } from './flows/welcome.flow';
import { hinchaRecordFlow } from './flows/hinchaRecord.flow';
import { abuelaMundialistaFlow } from './flows/abuelaMundialista.flow';
import { adivinoFlow, iaConsultarFlow } from './flows/adivino.flow';
import { proximosFlow, equiposFlow, calendarioFlow } from './flows/calendario.flow';

const PORT = process.env.PORT ?? 3008;

// Usar singleton para servicios
const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

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
• *TRISTE* - La abuela te consuela (cuando perdés) 👵
• *PREDIGO ARG 2-1 BRA* - Juega tus propios pronósticos 🔮
• *IA ARG vs BRA* - Consulta la predicción de nuestra IA 🧠
• *PROXIMOS* - Próximos partidos ⚽
• *EQUIPOS* - Todas las selecciones 🌍
• *CALENDARIO* - Partidos completos 📅

${partidosTexto}`);
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
    
    await flowDynamic(`⚽ *Comandos disponibles:*\n• TRIVIA\n• RANKING\n• TRISTE\n• PREDIGO\n• PROXIMOS\n• EQUIPOS\n• CALENDARIO`);
  });

const main = async () => {

  const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/mongo-mundial';

  console.log('🍃 Conectando a MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB conectado satisfactoriamente.');

  console.log('🚀 Iniciando Bot del Mundial 2026...');
  console.log('📅 Cargando calendario...');
  
  const adapterFlow = createFlow([
    mainFlow,
    welcomeFlow,
    hinchaRecordFlow,
    abuelaMundialistaFlow,
    adivinoFlow,
    iaConsultarFlow,
    proximosFlow,
    equiposFlow,
    calendarioFlow,
    commandFlow
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
  
  // Endpoint para obtener ranking
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
  console.log('\n📋 *Comandos disponibles:*');
  console.log('   • TRIVIA - Poné a prueba tus conocimientos');
  console.log('   • RANKING - Tabla de los más locos');
  console.log('   • TRISTE - Consuelo de la abuela');
  console.log('   • PREDIGO - Pronostica resultados');
  console.log('   • PROXIMOS - Próximos partidos');
  console.log('   • EQUIPOS - Todas las selecciones');
  console.log('   • CALENDARIO - Partidos completos');
};

main().catch(console.error);