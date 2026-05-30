import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { initializeSchema } from './db/schema.js';
import { remindersRouter } from './routes/reminders.js';
import { contentRouter } from './routes/content.js';
import { settingsRouter } from './routes/settings.js';
import { startScheduler } from './services/scheduler.js';
import { logger } from './logger.js';

initializeSchema();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.use('/reminders', remindersRouter);
app.use('/content', contentRouter);
app.use('/settings', settingsRouter);

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  logger.error('Error interno no controlado.', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
};

app.use(errorHandler);

app.listen(port, () => {
  logger.info('Abyssal backend iniciado.', {
    port,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    timezone: process.env.TIMEZONE ?? 'UTC',
    resendFromConfigured: Boolean(process.env.RESEND_FROM),
    userEmailConfigured: Boolean(process.env.USER_EMAIL)
  });
  startScheduler();
});
