import Anthropic from '@anthropic-ai/sdk';
import { format } from 'date-fns';
import quotes from '../content/quotes.json' with { type: 'json' };
import type { Quote } from '../types.js';
import { logger } from '../logger.js';
import { getNowInTimezone } from '../dateUtils.js';

const prompt = 'Genera un dato curioso sobre el oceano profundo o una cita de literatura de detectives. Una sola oracion. Tono evocador pero concreto. Sin introduccion ni cierre. Responde solo con la oracion, sin comillas ni puntuacion final adicional.';

function getFallbackQuote(): Quote {
  const allQuotes = quotes as Quote[];
  const index = Math.floor(Math.random() * allQuotes.length);
  return allQuotes[index] ?? {
    category: 'ocean',
    text: 'El oceano profundo conserva secretos que aun no tienen nombre.'
  };
}

function getDateSeed(dateKey: string) {
  return [...dateKey].reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getDailyThematicContent(): Quote {
  const allQuotes = quotes as Quote[];
  const dateKey = format(getNowInTimezone(), 'yyyy-MM-dd');
  const index = getDateSeed(dateKey) % allQuotes.length;

  return allQuotes[index] ?? {
    category: 'ocean',
    text: 'El oceano profundo conserva secretos que aun no tienen nombre.'
  };
}

export async function getThematicContent(): Promise<Quote> {
  const claudeEnabled = process.env.CLAUDE_CONTENT_ENABLED === 'true' && Boolean(process.env.CLAUDE_API_KEY);

  if (!claudeEnabled) {
    return getFallbackQuote();
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    });
    const block = response.content[0];
    if (block?.type === 'text' && block.text.trim().length > 0) {
      return { category: 'mystic', text: block.text.trim() };
    }
  } catch (error) {
    logger.error('No se pudo obtener contenido desde Claude; usando fallback JSON.', error);
  }

  return getFallbackQuote();
}
