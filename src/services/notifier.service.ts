import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { MongoUser } from '../models/mongo.schemas'; // Ajusta a tus rutas de modelos

export class NotifierService {
  private provider: any;

  constructor(provider: any) {
    this.provider = provider;
  }

  /**
   * Inicializa el Cron Job para ejecutarse todos los días a las 22:00 (10:00 PM)
   */
    // 🌟 6 Asteriscos = Ejecución cada segundo en librerías compatibles
//     cron.schedule('*/1 * * * * *', async () => {
//       console.log('⏰ [TEST SEGUNDOS] Ejecutando ráfaga de resultados...');
//       await this.enviarResumenDelDia();
//     }, {
//       timezone: "America/Lima" // Tu zona horaria
//     });
//   }
  public inicializarCronResultados(): void {
    this.enviarResumenDelDia();
    
    cron.schedule('0 22 * * *', async () => {
      console.log('⏰ [CRON] Iniciando envío automático de resultados diarios a usuarios Premium...');
      await this.enviarResumenDelDia();
    }, {
      // timezone: "America/Mexico_City" // Mantenemos únicamente la zona horaria
      timezone: "America/Lima" // Mantenemos únicamente la zona horaria
    });
    
    console.log('📆 [CRON] Monitor de resultados diarios registrado (Ejecución: 10:00 PM)');
  }

  /**
   * Procesa el archivo copia de resultados y despacha las notificaciones masivas
   */
  private async enviarResumenDelDia(): Promise<void> {
    try {
      // 1. Obtener la fecha de hoy en formato ISO estándar (AAAA-MM-DD)
      // const hoy = new Date().toISOString().split('T')[0];
      // 🌟 SOLUCIÓN EN ISO LOCAL: Genera 'AAAA-MM-DD' basado exactamente en la hora de Lima/Bogotá
      const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });

      console.log(`🔍 [CRON] Buscando en el JSON partidos programados para la fecha local: ${hoy}`);

      // 🌟 TU IDEA IMPLEMENTADA: Apuntamos con precisión quirúrgica a tu archivo copia
      const jsonResultadosPath = path.join(process.cwd(), 'data', 'worldcup2026_resultados.json');
      
      if (!fs.existsSync(jsonResultadosPath)) {
        console.error(`❌ [CRON] Error: No se encontró la copia del archivo en: ${jsonResultadosPath}`);
        return;
      }

      const rawData = fs.readFileSync(jsonResultadosPath, 'utf8');
      const { matches } = JSON.parse(rawData);

      // Filtramos los compromisos agendados para la fecha de hoy
      const partidosDeHoy = matches.filter((m: any) => m.date === hoy);

      if (partidosDeHoy.length === 0) {
        console.log(`📭 [CRON] No se registraron partidos oficiales para el día de hoy (${hoy}).`);
        return;
      }

      // 2. Maquetación estética del Flyer de WhatsApp en Español
      let resumenTexto = `⚽ *RESUMEN OFICIAL DE LA JORNADA* ⚽\n`;
      resumenTexto += `📅 Fecha: *${hoy.split('-').reverse().join('-')}*\n`;
      resumenTexto += `───────────────────────\n\n`;

      partidosDeHoy.forEach((p: any) => {
        // Rescatamos los goles asentados en la copia del JSON, de lo contrario un guion por defecto
        const goles1 = p.goals1 !== undefined ? p.goals1 : '-';
        const goles2 = p.goals2 !== undefined ? p.goals2 : '-';
        
        resumenTexto += `• *${p.team1.toUpperCase()}* ${goles1}  vs  ${goles2}  *${p.team2.toUpperCase()}*\n`;
        resumenTexto += `🏟️ _Estadio: ${p.ground}_ | 📌 _${p.round}_\n\n`;
      });

      resumenTexto += `───────────────────────\n`;
      resumenTexto += `🚀 _Mensaje automático enviado a la comunidad VIP con suscripción activa._`;
      resumenTexto += `───────────────────────\n`;
      resumenTexto += `_Escribe *MENU* para regresar al inicio._`;

      // 3. Extracción de destinatarios VIP desde MongoDB
      // Buscamos usuarios activos que posean correo electrónico (criterio de tu opción 9)
      const usuariosVIP = await MongoUser.find({ active: true, email: { $ne: null } });

      if (usuariosVIP.length === 0) {
        console.log('📢 [CRON] Envío cancelado: No existen usuarios Premium registrados en la base de datos.');
        return;
      }

      console.log(`📤 [CRON] Despachando alertas a ${usuariosVIP.length} suscriptores...`);

      // 4. Envío masivo controlado por ráfagas (Anti-Baneo de WhatsApp)
      for (const usuario of usuariosVIP) {
        const jid = `${usuario.phone}@s.whatsapp.net`;
        
        // Ejecutamos la inyección nativa del mensaje usando Baileys
        await this.provider.sendMessage(jid, resumenTexto, {});
        
        // Delay de seguridad de 2.5 segundos entre chats para proteger el número de WhatsApp
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      console.log('✅ [CRON] El resumen masivo ha sido transmitido con total éxito.');

    } catch (error) {
      console.error('❌ Error crítico en la ejecución del bucle del Cron de resultados:', error);
    }
  }
}