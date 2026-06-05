import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';
import { validateEmail } from '../utils/validateEmail';

import { MongoUser } from '../models/mongo.schemas';

const locuraService = LocuraService.getInstance(); //[cite: 12]

export const suscripcionFlow = addKeyword(['solicitar_suscripcion_interna'])
  .addAnswer(
    [
      '📨 *SUSCRIPCIÓN PREMIUM DEL MUNDIAL* 📨',
      '',
      '¡Activa tus alertas exclusivas y sé el primero en recibir:',
      '⚽ Resultados en tiempo real de los partidos.',
      '📈 Variaciones del Ranking FIFA al instante.',
      '🧠 Pronósticos avanzados e informes de nuestra IA.',
      '',
      '✍️ Para comenzar, por favor escribe tu *Nombre Completo*:',
      '',
      'Ejemplo: \`Juan Palomino\`',
      '',
      '_(O escribe *MENU* para cancelar)_'
    ].join('\n'),
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      const nombreInput = ctx.body.trim();

      // Cláusula de escape standard[cite: 12]
      if (['menu', 'hola', 'volver', 'ayuda'].includes(nombreInput.toLowerCase())) {
        return;
      }

      // Validaciones de robustez del nombre completo[cite: 12]
      if (nombreInput.length < 8) {
        return fallBack('⚠️ *Nombre demasiado corto.* Por favor, ingresa tu *Nombre Completo:*' +
                        `\n(Ejemplo: \`Juan Palomino\`)`
        );
      }

      if (nombreInput.length > 50) {
        return fallBack('⚠️ Por favor, ingresa un nombre más corto (máximo 50 caracteres):');
      }

      // Almacenamos temporalmente el nombre en el estado del usuario
      await state.update({ registerName: nombreInput });

      // Avanzamos al siguiente paso de captura de manera fluida
      return await flowDynamic(`🤝 ¡Mucho gusto, *${nombreInput}*!\n\n📧 Ahora, por favor ingresa tu **Correo Electrónico** para vincular tu suscripción: \nEjemplo: \`usuario@gmail.com\``);
    }
  )
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, fallBack }) => {
    const emailInput = ctx.body.trim().toLowerCase();
    const phone = ctx.from; // Capturamos el número de teléfono nativo de WhatsApp[cite: 12]

    // Cláusula de escape standard[cite: 12]
    if (['menu', 'hola', 'volver', 'ayuda'].includes(emailInput)) {
      return;
    }

    // Uso de tu función personalizada alojada en utils
    const isEmailValid = validateEmail(emailInput);

    if (!isEmailValid) {
      return fallBack('⚠️ *Correo electrónico no válido.*\n\nAsegúrate de incluir el "@" y un dominio correcto (Ejemplo: `usuario@gmail.com`).\n\nInténtalo de nuevo:');
    }

    // Recuperamos el nombre almacenado en el paso anterior
    const nombreGuardado = state.get('registerName');

    try {
      // 💾 PERSISTENCIA EN MONGO DB A TRAVÉS DE TU SERVICIO EXISTENTE
      // Recuperamos el documento actual del usuario de la Copa del Mundo[cite: 12, 14]
      // const user = await locuraService.getUser(phone); //[cite: 12]
      // Usamos findOneAndUpdate con el operador $set para obligar a Mongo a registrar el correo
      const userUpdated = await MongoUser.findOneAndUpdate(
        { phone: phone }, // Buscamos por el teléfono de WhatsApp[cite: 17, 19]
        { 
          $set: { 
            name: nombreGuardado,
            email: emailInput,
            lastActive: Date.now(),
            active: true
          } 
        },
        { new: true, upsert: true } // Si el usuario no existe por algún motivo, lo crea (upsert)
      );

      if (!userUpdated) {
        throw new Error('No se pudo actualizar o crear el usuario en la base de datos.');
      }

      // Mensaje estético final con formato premium de confirmación
      const mensajeExito = [
        `✅ *¡SUSCRIPCIÓN ACTIVADA EXITOSAMENTE!* 🎉`,
        `───────────────────────`,
        `👤 *Titular:* ${nombreGuardado}`,
        `📧 *Correo:* ${emailInput}`,
        `📱 *WhatsApp vinculado:* +${phone}`,
        `───────────────────────`,
        `🚀 Desde este momento estás en la lista preferencial. Te notificaremos de manera automatizada cada vez que ruede el balón.`,
        ``,
        `_Escribe *MENU* para volver a las opciones principales._`
      ].join('\n');

      // Limpiamos los estados temporales de registro para evitar basura en memoria
      await state.update({ registerName: null });

      return await flowDynamic(mensajeExito);

    } catch (error) {
      console.error('Error crítico al guardar la suscripción en MongoDB:', error);
      return await flowDynamic('❌ Hubo un inconveniente técnico al procesar tu suscripción en la base de datos. Por favor, inténtalo de nuevo en unos minutos.');
    }
  });