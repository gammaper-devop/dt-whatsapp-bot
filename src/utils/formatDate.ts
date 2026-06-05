/**
 * Convierte una fecha en formato ISO (AAAA-MM-DD) al formato amigable (DD-MM-AAAA).
 * @param isoDate Cadena de texto de la fecha proveniente del JSON (Ej: "2025-09-18").
 */
export function formatDateDMY(isoDate: string): string {
    if (!isoDate) return "";
    
    // Dividimos la fecha por sus guiones: [año, mes, día]
    const parts = isoDate.split("-");
    
    // Si por alguna razón la estructura no tiene las 3 partes, devolvemos la original por seguridad
    if (parts.length !== 3) return isoDate;
    
    const [year, month, day] = parts;
    
    // Retornamos combinando en el nuevo orden deseado: Dia-Mes-Ano
    return `${day}-${month}-${year}`;
  }