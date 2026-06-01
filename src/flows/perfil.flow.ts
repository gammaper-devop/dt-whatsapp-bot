import { addKeyword } from '@builderbot/bot';
import { LocuraService } from '../services/locura.service';

const locuraService = LocuraService.getInstance();

export const perfilFlow = addKeyword(['solicitar_perfil_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    const phone = ctx.from;
    const user = await locuraService.getUser(phone);
    
    // Identificar si el nombre actual es el alias por defecto
    const nombreActual = user.name && !user.name.includes(phone.slice(-4)) ? user.name : `Fanático ${phone.slice(-4)}`;

    await flowDynamic(`👤 *CONFIGURACIÓN DE PERFIL* 👤\n\n📋 *Nombre actual:* ${nombreActual}\n\n✍️ Por favor, escribe el **nuevo nombre** con el que deseas aparecer en el Ranking Oficial:\n\n_(O escribe *MENU* para cancelar y salir)_`);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack }) => {
    const phone = ctx.from;
    const nuevoNombre = ctx.body.trim();

    // Cláusula de escape
    if (['menu', 'hola', 'volver', 'ayuda'].includes(nuevoNombre.toLowerCase())) {
      return;
    }

    // Validaciones básicas de robustez para el nombre
    if (nuevoNombre.length < 3) {
      return fallBack(`⚠️ *Nombre demasiado corto.*\n\nEl nombre debe tener al menos 3 caracteres para ser válido. Inténtalo de nuevo:`);
    }

    if (nuevoNombre.length > 20) {
      return fallBack(`⚠️ *Nombre demasiado largo.*\n\nPor favor, elige un nombre o apodo menor a 20 caracteres para que quepa bien en la tabla del Ranking. Inténtalo de nuevo:`);
    }

    // Obtener el usuario, actualizar el campo name y guardarlo usando el servicio existente
    const user = await locuraService.getUser(phone);
    user.name = nuevoNombre;
    await locuraService.updateUser(phone, user);

    await flowDynamic(`✅ *¡PERFIL ACTUALIZADO!* 🎉\n\n👤 *Tu nuevo alias:* ${nuevoNombre}\n\nA partir de este momento, aparecerás con este nombre en el cuadro de honor de la comunidad.\n\n_Escribe *MENU* para volver al menú principal._`);
  });