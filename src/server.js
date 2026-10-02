import dotenv from 'dotenv';
import express from 'express';

dotenv.config({ quiet: true });

const required = [
  'PORT',
  'PUBLIC_URL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM',
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Faltan variables de entorno en .env: ${missing.join(', ')}`);
  process.exit(1);
}

// Se importa después de validar el .env porque crea el cliente de Twilio al cargar.
const { webhook } = await import('./webhook.js');

const app = express();

app.get('/', (req, res) => res.send('ok'));
app.use(webhook);

app.listen(process.env.PORT, () => {
  console.log(`Server escuchando en http://localhost:${process.env.PORT}`);
  console.log(`Webhook de Twilio: ${process.env.PUBLIC_URL}/whatsapp`);
});
