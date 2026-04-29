import { addKeyword } from '@builderbot/bot';
import { FifaCalendarService } from '../services/fifaCalendar.service';

const calendarService = new FifaCalendarService();

// Flujo para PRÓXIMOS PARTIDOS
export const proximosFlow = addKeyword(['proximos', 'próximos', 'proximos partidos', 'proximos partidos'])
  .addAction(async (ctx, { flowDynamic }) => {
    const proximos = calendarService.getProximosPartidos(5);
    const mensaje = calendarService.formatearListaProximos(proximos);
    await flowDynamic(mensaje);
  });

// Flujo para EQUIPOS
export const equiposFlow = addKeyword(['equipos', 'selecciones', 'participantes', 'grupos'])
  .addAction(async (ctx, { flowDynamic }) => {
    const mensaje = calendarService.formatearListaEquipos();
    await flowDynamic(mensaje);
  });

// Flujo para CALENDARIO COMPLETO
export const calendarioFlow = addKeyword(['calendario', 'calendario completo', 'todos los partidos', 'fixture'])
  .addAction(async (ctx, { flowDynamic }) => {
    // Mensaje de proceso
    await flowDynamic('📅 Generando calendario completo del Mundial 2026... ⏳');
    
    // Generar y enviar calendario
    const mensaje = calendarService.getCalendarioCompleto();
    await flowDynamic(mensaje);
  });