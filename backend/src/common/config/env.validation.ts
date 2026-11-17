import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),
  PORT: z.coerce.number().int().positive().optional().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  SESSION_SECRET: z
    .string()
    .min(64, 'SESSION_SECRET deve possuir no mínimo 64 caracteres'),
  S3_ENDPOINT: z.string().url('S3_ENDPOINT deve ser uma URL válida'),
  S3_REGION: z.string().min(1, 'S3_REGION é obrigatória'),
  S3_ACCESS_KEY: z.string().min(1, 'S3_ACCESS_KEY é obrigatória'),
  S3_SECRET_KEY: z.string().min(1, 'S3_SECRET_KEY é obrigatória'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET é obrigatória'),
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().optional().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuração de ambiente inválida: ${details}`);
  }
  return result.data;
}
