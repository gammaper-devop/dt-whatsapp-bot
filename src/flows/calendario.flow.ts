import { addKeyword } from '@builderbot/bot';
import { FifaCalendarService } from '../services/fifaCalendar.service';

const calendarService = new FifaCalendarService();

// =====================================================================
// OPT 6: FLUJO PARA PRÓXIMOS PARTIDOS
// =====================================================================
export const proximosFlow = addKeyword(['ejecutar_proximos_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    const proximos = calendarService.getProximosPartidos(5);
    let mensaje = calendarService.formatearListaProximos(proximos);
    
    mensaje += `\n\n💡 _Escribe *MENU* para regresar a las opciones principales._`;
    
    await flowDynamic(mensaje);
  });

// =====================================================================
// OPT 7: FLUJO PARA EQUIPOS Y SELECCIONES
// =====================================================================
export const equiposFlow = addKeyword(['ejecutar_equipos_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    let mensaje = calendarService.formatearListaEquipos();
    
    mensaje += `\n\n💡 _Escribe *MENU* para regresar a las opciones principales._`;
    
    await flowDynamic(mensaje);
  });

// =====================================================================
// OPT 8: FLUJO PARA CALENDARIO COMPLETO (FIXTURE)
// =====================================================================
export const calendarioFlow = addKeyword(['ejecutar_calendario_interno'])
  .addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic('📅 *Generando calendario completo en español...* ⏳');
    
    let mensaje = calendarService.getCalendarioCompleto();
    
    mensaje += `\n\n💡 _Escribe *MENU* para regresar a las opciones principales._`;
    
    await flowDynamic(mensaje);
  });