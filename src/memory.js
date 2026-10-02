// Historial en memoria SOLO para la demo: se pierde al reiniciar el server
// y no escala a más de una instancia. En producción va a una base de datos.

const MAX_MESSAGES = 10;
const conversations = new Map(); // From -> [{ role, content }]

export function getHistory(from) {
  return conversations.get(from) ?? [];
}

export function addMessage(from, role, content) {
  const history = getHistory(from);
  // Si el mensaje anterior quedó sin respuesta (falló la IA), lo reemplazamos
  // para mantener user/assistant alternados, como pide la API.
  if (history.at(-1)?.role === role) history.pop();
  history.push({ role, content });
  // Cortamos a los últimos 10, arrancando siempre por un mensaje del usuario.
  while (history.length > MAX_MESSAGES || history[0]?.role === 'assistant') history.shift();
  conversations.set(from, history);
}
