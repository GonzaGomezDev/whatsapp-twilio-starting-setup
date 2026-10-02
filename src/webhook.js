import express from 'express';
import twilio from 'twilio';
import { generateReply } from './ai.js';
import { getHistory, addMessage } from './memory.js';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, PUBLIC_URL } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const ONLY_TEXT = 'Por ahora solo leo mensajes de texto.';
const FALLBACK = 'Uy, tuve un problema para responderte. Probá de nuevo en un ratito.';

// whatsapp:+5491112345678 -> ********5678
const mask = (from) => {
  const digits = from.replace(/\D/g, '');
  return '*'.repeat(Math.max(digits.length - 4, 0)) + digits.slice(-4);
};

export const webhook = express.Router();

webhook.post('/whatsapp', express.urlencoded({ extended: false }), (req, res) => {
  // Twilio firma la URL pública (la de ngrok), no la que ve Express.
  const url = PUBLIC_URL + req.originalUrl;
  const signature = req.header('X-Twilio-Signature');

  if (!signature) {
    console.warn('[403] Request sin header X-Twilio-Signature');
    return res.status(403).send('Forbidden');
  }
  if (!twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, req.body)) {
    console.warn(`[403] Firma inválida para ${url} (¿PUBLIC_URL desactualizada?)`);
    return res.status(403).send('Forbidden');
  }

  // Respondemos ya: Twilio corta el webhook a los 15 segundos.
  res.type('text/xml').send('<Response></Response>');

  handleMessage(req.body).catch((err) => console.error('[ERR] Inesperado:', err.message));
});

async function handleMessage({ From, Body = '', ProfileName, NumMedia = '0' }) {
  const text = Body.trim();
  console.log(`[IN]  ${mask(From)}${ProfileName ? ` (${ProfileName})` : ''}: ${text || '[media]'}`);

  let reply;
  if (Number(NumMedia) > 0 && !text) {
    reply = ONLY_TEXT;
  } else {
    try {
      addMessage(From, 'user', text);
      const start = Date.now();
      reply = await generateReply(getHistory(From), ProfileName);
      console.log(`[AI]  ${((Date.now() - start) / 1000).toFixed(1)}s`);
      addMessage(From, 'assistant', reply);
    } catch (err) {
      console.error('[ERR] IA:', err.message);
      reply = FALLBACK;
    }
  }

  try {
    await client.messages.create({ from: TWILIO_WHATSAPP_FROM, to: From, body: reply });
    console.log(`[OUT] ${mask(From)}: ${reply}`);
  } catch (err) {
    console.error(`[ERR] Twilio${err.code ? ` ${err.code}` : ''}:`, err.message);
    if (reply === FALLBACK) return;
    try {
      await client.messages.create({ from: TWILIO_WHATSAPP_FROM, to: From, body: FALLBACK });
      console.log(`[OUT] ${mask(From)}: ${FALLBACK}`);
    } catch (err2) {
      console.error('[ERR] Twilio (fallback):', err2.message);
    }
  }
}
