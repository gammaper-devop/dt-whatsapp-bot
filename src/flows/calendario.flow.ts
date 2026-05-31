import { addKeyword } from '@builderbot/bot';
import { FifaCalendarService } from '../services/fifaCalendar.service';

const calendarService = new FifaCalendarService();

// =====================================================================
// OPT 6: FLUJO PARA PRÓXIMOS PARTIDOS (Inmune a rebotes)
// =====================================================================
export const proximosFlow = addKeyword(['ejecutar_proximos_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    const proximos = calendarService.getProximosPartidos(5);
    let mensaje = calendarService.formatearListaProximos(proximos);
    
    // Guía de navegación para regresar al menú
    mensaje += `\n\n💡 _Escribe *MENU* para regresar a las opciones principales._`;
    
    await flowDynamic(mensaje);
  });

// =====================================================================
// OPT 7: FLUJO PARA EQUIPOS Y SELECCIONES (Inmune a rebotes)
// =====================================================================
export const equiposFlow = addKeyword(['ejecutar_equipos_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    let mensaje = calendarService.formatearListaEquipos();
    
    mensaje += `\n\n💡 _Escribe *MENU* para regresar a las opciones principales._`;
    
    await flowDynamic(mensaje);
  });

// =====================================================================
// OPT 8: FLUJO PARA CALENDARIO COMPLETO (Inmune a rebotes)
// =====================================================================
export const calendarioFlow = addKeyword(['ejecutar_calendario_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    // Mensaje de feedback de carga para el usuario
    await flowDynamic('📅 *Generando calendario completo del Mundial 2026...* ⏳');
    
    let mensaje = calendarService.getCalendarioCompleto();
    
    mensaje += `\n\n💡 _Escribe *MENU* para regresar a las opciones principales._`;
    
    await flowDynamic(mensaje);
  });