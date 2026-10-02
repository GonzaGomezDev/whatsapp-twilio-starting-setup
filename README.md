# whatsapp-twilio-demo

Webhook que recibe mensajes de WhatsApp vía Twilio, genera una respuesta con un modelo gratis de [OpenRouter](https://openrouter.ai/) y se la manda a quien escribió.

Requiere Node 20+ y [ngrok](https://ngrok.com/).

## Cómo correrlo

1. Instalá dependencias y creá tu `.env`:
   ```bash
   npm install
   cp .env.example .env
   ```
   Completá `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `OPENROUTER_API_KEY` (se crea gratis en https://openrouter.ai/keys, sin tarjeta).
2. Levantá el server:
   ```bash
   npm run dev
   ```
3. En otra terminal, exponé el puerto:
   ```bash
   ngrok http 3000
   ```
   Copiá la URL `https://...` a `PUBLIC_URL` en el `.env` y reiniciá el server.
4. En la consola de Twilio:
   - **Sandbox:** Messaging > Try it out > Send a WhatsApp message > Sandbox settings. En "When a message comes in" poné `PUBLIC_URL/whatsapp` (ej. `https://abc123.ngrok-free.app/whatsapp`), método `POST`, y guardá.
   - **Número propio:** lo mismo, en la configuración del sender de WhatsApp.
5. Mandá un mensaje desde el celular y mirá los logs:
   ```
   [IN]  *********5678 (Juan): hola, ¿qué hacen?
   [AI]  1.8s
   [OUT] *********5678: ¡Hola Juan! Somos Acme Demo...
   ```

El comportamiento del asistente se edita en `prompts/system.md`, sin tocar código.

## Problemas comunes

- **403 por firma inválida.** Cambió la URL de ngrok y `PUBLIC_URL` quedó vieja. Twilio firma la URL exacta que tiene configurada: actualizá `PUBLIC_URL` y reiniciá el server.
- **El webhook no llega.** En Twilio quedó la URL de una sesión anterior de ngrok (cambia cada vez que lo reiniciás en el plan gratis). Actualizala en Sandbox settings o en el sender.
- **Error 63016.** WhatsApp solo permite texto libre dentro de las 24 horas desde el último mensaje de la persona. Fuera de esa ventana hay que usar un template aprobado. En el sandbox, además, tenés que volver a mandar el `join <código>` si se venció.
- **La IA tarda mucho o responde error 429.** Los modelos `:free` de OpenRouter tienen límites (unos 20 pedidos por minuto y un tope diario) y a veces están saturados. Probá otro modelo en `OPENROUTER_MODEL`: la lista está en https://openrouter.ai/models?max_price=0, o usá `openrouter/free`, que elige uno disponible automáticamente.
