import { z, ZodType } from 'zod';

export class TodoValidation {
  static readonly LIST: ZodType = z.object({
    page: z.number().min(1),
    size: z.number().min(1).max(25),
  });
  static readonly CREATE: ZodType = z.object({
    title: z.string().min(1).max(100),
    completed: z.boolean().optional(),
  });
  static readonly UPDATE: ZodType = z.object({
    title: z.string().min(1).max(100),
    completed: z.boolean(),
  });
}
