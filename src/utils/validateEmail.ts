/**
 * Valida si una cadena de texto tiene una estructura de correo electrónico válida.
 * @param email Cadena de texto proporcionada por el usuario.
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }