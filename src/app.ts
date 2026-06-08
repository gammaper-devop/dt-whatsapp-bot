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
import { rankingFifaFlow } from './flows/rankingFifa.flow';
import { adivinoFlow, iaConsultarFlow } from './flows/adivino.flow';
import { proximosFlow, equiposFlow, calendarioFlow } from './flows/calendario.flow';
import { suscripcionFlow } from './flows/suscripcion.flow';
import { poissonFlow } from './flows/poisson.flow';

const PORT = process.env.PORT ?? 3008;

// Usar singleton para servicios
const locuraService = LocuraService.getInstance();
const calendarService = new FifaCalendarService();

// =====================================================================
// FLUJO PRINCIPAL UNIFICADO: MENÚ Y ENRUTADOR SEGURO (Bajo control)
// =====================================================================
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
    
    await flowDynamic(`🔥 *¡BIENVENIDO A LA ZONA DE CANDELA MUNDIALISTA! 🔥, ${userName.toUpperCase()}!* 🎉

      ¡Hola! Bienvenido al Bot Oficial del Mundial 2026. ⚽🤖,

      *Comandos disponibles:*
      1. *TRIVIA* - Reta y pon a prueba tus conocimientos 🧠
      2. *RANKING* - Consulta el ranking FIFA 2026 🏆
      3. *PREDIGO* - Juega tus propios pronósticos 🔮
      4. *OJO DEL DT* - Pronóstico nuestro cerebro artificial 🤖
      5. *JUGADA MATEMÁTICA* - Los 5 marcadores más probables 📈
      6. *PROXIMOS* - Próximos partidos ⚽
      7. *EQUIPOS* - Todas las selecciones 🌍
      8. *CALENDARIO* - Partidos completos 📅
      9. *SUSCRIPCIÓN* - Recibe alertas exclusivas 📨

      ${partidosTexto}

      ⚡ _¿Cuál es tu primera jugada? Responde directamente con el número de tu opción:_`);
  })
  .addAction({ capture: true }, async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const opcion = ctx.body.trim();
    
    // Lista de opciones numéricas estrictas que permitimos procesar en el menú
    const opcionesValidas = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    if (!opcionesValidas.includes(opcion)) {
      return fallBack(`❌ Opción no válida. Por favor, selecciona un número del *1 al 9* o escribe *MENU* para volver a empezar.`);
    }
    
    // El enrutador ahora solo se ejecuta de forma interna y controlada tras la captura
    switch (opcion) {
      case '1':
        return gotoFlow(hinchaRecordFlow); // Ejecuta Trivia de forma aislada
      case '2':
        return gotoFlow(rankingFifaFlow); // Ejecuta Ranking de forma aislada
      case '3':
        return gotoFlow(adivinoFlow);
      case '4':
        return gotoFlow(iaConsultarFlow);
      case '5':
        return gotoFlow(poissonFlow);
      case '6':
        return gotoFlow(proximosFlow);
      case '7':
        return gotoFlow(equiposFlow);
      case '8':
        return gotoFlow(calendarioFlow);
      case '9':
        return gotoFlow(suscripcionFlow);
    }
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
    rankingFifaFlow,       
    adivinoFlow,          
    iaConsultarFlow,      
    proximosFlow,
    equiposFlow,       
    calendarioFlow,
    suscripcionFlow,
    poissonFlow        
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
};

main().catch(console.error);