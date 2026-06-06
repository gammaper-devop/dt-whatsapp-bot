import { addKeyword } from '@builderbot/bot';
import { MongoUser } from '../models/mongo.schemas'; // Ajusta la ruta relativa según tus carpetas
import { validateEmail } from '../utils/validateEmail'; // Tu validador de correos que subiste

export const suscripcionFlow = addKeyword(['solicitar_suscripcion_interna'])
  .addAction(async (ctx, { flowDynamic, state, endFlow }) => {
    const phone = ctx.from;

    try {
      // 🕵️‍♂️ FILTRO DE PERSISTENCIA INTELIGENTE
      // Buscamos si el usuario ya existe en MongoDB y si tiene un correo activo
      const user = await MongoUser.findOne({ phone: phone });

      if (user && user.email) {
        // 🌟 JUGADA A: Si ya está registrado, lo saludamos y cerramos el flujo con estilo
        return endFlow([
          `✉️ *SITACIÓN DE TU SUSCRIPCIÓN* ✉️`,
          ``,
          `¡Hola, *${user.name.toUpperCase()}*! 👋`,
          ``,
          `🚀 Queremos confirmarte que tu *Suscripción Premium* ya se encuentra completamente activa en nuestra base de datos mundialista.`,
          ``,
          `📌 *Datos vinculados:*`,
          `• *Correo:* ${user.email}`,
          `• *WhatsApp:* +${phone}`,
          ``,
          `Estás en la lista preferencial VIP. Recibirás alertas de goles en tiempo real, variaciones del ranking y reportes estadísticos exclusivos directo en este chat. ⚽🤖🔥`,
          ``,
          `_Escribe *MENU* para volver a la lista de opciones principales._`
        ].join('\n'));
      }

      // 🌟 JUGADA B: Si no está registrado o no tiene correo, iniciamos el onboarding dinámico
      await flowDynamic([
        `📨 *SUSCRIPCIÓN PREMIUM DEL MUNDIAL* 📨`,
        ``,
        `¡Activa tus alertas exclusivas y sé el primero en recibir:`,
        `⚽ Resultados en tiempo real de los partidos.`,
        `📈 Variaciones del Ranking FIFA al instante.`,
        `🧠 Pronósticos avanzados e informes de nuestra IA.`,
        ``,
        `✍️ Para comenzar, por favor escribe tu *Nombre Completo*:`,
        ``,
        `_Ejemplo: Juan Palomino_`,
        ``,
        `_(O escribe *MENU* para cancelar)_`
      ].join('\n'));

    } catch (error) {
      console.error('Error al verificar suscripción en MongoDB:', error);
      return endFlow('❌ Hubo un inconveniente técnico al conectar con la base de datos de suscripciones. Por favor, inténtalo de nuevo escribiendo *MENU*.');
    }
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, fallBack }) => {
    const inputName = ctx.body.trim();

    // Cláusula de escape rápida
    if (['menu', 'hola', 'ayuda', 'volver'].includes(inputName.toLowerCase())) {
      return; 
    }

    if (inputName.length < 8) {
      return fallBack('⚠️ *Nombre demasiado corto.* Por favor, ingresa tu *Nombre Completo:*' +
                      `\n(Ejemplo: \`Juan Palomino\`)`
      );
    }

    // Guardamos el nombre temporalmente en el estado en memoria de BuilderBot
    await state.update({ registerName: inputName });

    await flowDynamic([
      `📧 *¡Excelente, ${inputName}!* Ahora necesitamos tu correo electrónico.`,
      ``,
      `✍️ *Escribe tu dirección de email actual:*`,
      `_Ejemplo: juan.palomino@gmail.com_`,
      ``,
      `_(O escribe *MENU* para cancelar)_`
    ].join('\n'));
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, fallBack }) => {
    const emailInput = ctx.body.trim().toLowerCase();

    // Cláusula de escape rápida
    if (['menu', 'hola', 'ayuda', 'volver'].includes(emailInput)) {
      return;
    }

    // Usamos tu módulo de validación utilitaria cargado
    const isEmailValid = validateEmail(emailInput); //

    if (!isEmailValid) { //
      return fallBack('⚠️ *Correo electrónico no válido.*\n\nPor favor, asegúrate de escribir una dirección correcta.\nEjemplo: `tuusuario@dominio.com` \n\n_Inténtalo de nuevo (o escribe *MENU* para salir):_');
    }

    const nombreGuardado = state.get('registerName');

    try {
      // 💾 ESCRITURA ATÓMICA BLINDADA EN MONGO DB
      await MongoUser.findOneAndUpdate(
        { phone: ctx.from },
        { 
          $set: { 
            name: nombreGuardado,
            email: emailInput,
            lastActive: Date.now()
          } 
        },
        { new: true, upsert: true }
      );

      // Limpiamos los estados de memoria para evitar residuos
      await state.update({ registerName: null });

      await flowDynamic([
        `✅ *¡SUSCRIPCIÓN PREMIUM ACTIVADA!* 🎉`,
        `───────────────────────`,
        `👤 *Titular:* ${nombreGuardado}`,
        `📧 *Correo:* ${emailInput}`,
        `📱 *WhatsApp:* +${ctx.from}`,
        `───────────────────────`,
        `🚀 ¡Bienvenido a bordo, crack! Desde este instante formas parte de nuestra suite preferencial. Te notificaremos de manera automatizada cada vez que ruede el balón.`,
        ``,
        `_Escribe *MENU* para regresar a las opciones principales._`
      ].join('\n'));

    } catch (error) {
      console.error('Error al guardar registro en Mongo:', error);
      return await flowDynamic('❌ Ocurrió un error técnico al almacenar tus datos en la suscripción. Por favor, vuelve a intentarlo en unos minutos.');
    }
  });