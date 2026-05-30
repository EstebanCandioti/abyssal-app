import { z } from 'zod';

const weekDaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:MM.');

const baseReminderSchema = z.object({
  title: z.string().trim().min(1, 'El titulo es requerido.'),
  description: z.string().trim().optional(),
  time: timeSchema,
  frequencyType: z.enum(['weekly', 'interval', 'weekly_interval']),
  frequencyDays: z.array(weekDaySchema).optional(),
  frequencyInterval: z.number().int().positive().optional(),
  frequencyStartDate: z.string().date().optional()
});

export const createReminderSchema = baseReminderSchema.superRefine((data, ctx) => {
  if (data.frequencyType === 'weekly' && (!data.frequencyDays || data.frequencyDays.length === 0)) {
    ctx.addIssue({ code: 'custom', path: ['frequencyDays'], message: 'frequencyDays es requerido para frecuencia weekly.' });
  }
  if (data.frequencyType === 'interval') {
    if (!data.frequencyInterval) {
      ctx.addIssue({ code: 'custom', path: ['frequencyInterval'], message: 'frequencyInterval es requerido para frecuencia interval.' });
    }
    if (!data.frequencyStartDate) {
      ctx.addIssue({ code: 'custom', path: ['frequencyStartDate'], message: 'frequencyStartDate es requerido para frecuencia interval.' });
    }
  }
  if (data.frequencyType === 'weekly_interval') {
    if (!data.frequencyDays || data.frequencyDays.length !== 1) {
      ctx.addIssue({ code: 'custom', path: ['frequencyDays'], message: 'frequencyDays debe tener un dia para frecuencia weekly_interval.' });
    }
    if (!data.frequencyInterval) {
      ctx.addIssue({ code: 'custom', path: ['frequencyInterval'], message: 'frequencyInterval es requerido para frecuencia weekly_interval.' });
    }
    if (!data.frequencyStartDate) {
      ctx.addIssue({ code: 'custom', path: ['frequencyStartDate'], message: 'frequencyStartDate es requerido para frecuencia weekly_interval.' });
    }
  }
});

export const updateReminderSchema = baseReminderSchema.partial().superRefine((data, ctx) => {
  if (data.frequencyType === 'weekly' && data.frequencyDays && data.frequencyDays.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['frequencyDays'], message: 'frequencyDays no puede estar vacio.' });
  }
  if (data.frequencyType === 'weekly_interval' && data.frequencyDays && data.frequencyDays.length !== 1) {
    ctx.addIssue({ code: 'custom', path: ['frequencyDays'], message: 'frequencyDays debe tener un dia.' });
  }
});
