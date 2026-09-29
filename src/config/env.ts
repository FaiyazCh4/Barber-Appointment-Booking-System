/**
 * George Davis Hairdressing — Robust Environment Variable Validator
 *
 * Implements strict runtime schema validation using Zod for critical
 * environment variables (including GEMINI_API_KEY, APP_URL, NODE_ENV)
 * at application startup, throwing descriptive errors if any are missing or invalid.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Ensure .env variables are loaded in Node.js runtime environments
if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
  dotenv.config();
}

export type EnvironmentMode = 'development' | 'production' | 'test';
export type NotificationProvider = 'console' | 'resend' | 'smtp';

export interface EnvErrorDetail {
  variable: string;
  message: string;
  tip?: string;
}

/**
 * Custom error thrown when environment variable validation fails at startup,
 * displaying structured, actionable diagnostic information.
 */
export class EnvValidationError extends Error {
  public readonly errors: EnvErrorDetail[];

  constructor(errors: EnvErrorDetail[]) {
    const formattedErrors = errors
      .map(
        (err, idx) =>
          `  ${idx + 1}. [${err.variable}] ${err.message}${
            err.tip ? `\n     💡 Tip: ${err.tip}` : ''
          }`
      )
      .join('\n');

    const message = [
      '',
      '================================================================================',
      '🚨 APPLICATION STARTUP HALTED: ENVIRONMENT VARIABLE VALIDATION FAILED',
      '================================================================================',
      `The following ${errors.length} required environment variable issue(s) were detected:`,
      '',
      formattedErrors,
      '',
      'Please check your .env file or deployment environment settings and restart.',
      '================================================================================',
      '',
    ].join('\n');

    super(message);
    this.name = 'EnvValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, EnvValidationError.prototype);
  }
}

/**
 * Helper to safely extract raw environment variables across Node.js and client contexts.
 */
function getRawValue(
  key: string,
  customSource?: Record<string, string | undefined>
): string | undefined {
  if (customSource !== undefined) {
    if (customSource[key] !== undefined) return customSource[key];
    // Fall back to process.env for unprovided keys when a partial customSource is supplied
    if (typeof process !== 'undefined' && process.env?.[key] !== undefined) {
      return process.env[key];
    }
    return undefined;
  }

  // 1. Node.js process.env
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key] !== undefined) return process.env[key];
    if (process.env[`VITE_${key}`] !== undefined) return process.env[`VITE_${key}`];
  }

  // 2. Vite client import.meta.env
  try {
    const meta = import.meta as unknown as { env?: Record<string, string> };
    if (meta?.env) {
      if (meta.env[key] !== undefined) return meta.env[key];
      if (meta.env[`VITE_${key}`] !== undefined) return meta.env[`VITE_${key}`];
    }
  } catch {
    // import.meta may not be available in all runtimes
  }

  return undefined;
}

/**
 * Core Zod Schema for environment configuration
 */
export const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      message: 'NODE_ENV must be one of: "development", "production", or "test".',
    })
    .default('development'),

  PORT: z
    .coerce
    .number({
      message: 'PORT must be a valid integer between 1 and 65535.',
    })
    .int('PORT must be an integer.')
    .min(1, 'PORT must be greater than 0.')
    .max(65535, 'PORT must be less than or equal to 65535.')
    .default(3000),

  APP_URL: z
    .string({
      message: 'APP_URL is required.',
    })
    .min(1, 'APP_URL is required.')
    .url('APP_URL must be a valid absolute URL (e.g. "http://localhost:3000" or "https://yourdomain.com").'),

  GEMINI_API_KEY: z
    .string({
      message: 'GEMINI_API_KEY is required for Gemini AI features and application runtime.',
    })
    .min(1, 'GEMINI_API_KEY cannot be empty.'),

  SESSION_SECRET: z
    .string()
    .default('george-davis-dev-secret-change-in-production-12345'),

  NOTIFICATION_PROVIDER: z
    .enum(['console', 'resend', 'smtp'], {
      message: 'NOTIFICATION_PROVIDER must be "console", "resend", or "smtp".',
    })
    .default('console'),

  NOTIFICATION_FROM_EMAIL: z
    .string()
    .default('George Davis Hairdressing <appointments@georgedavishairdressing.co.uk>'),

  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  ENABLE_ONLINE_DEPOSITS: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
      }
      return Boolean(val);
    }, z.boolean())
    .default(false),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Supabase Backend
  SUPABASE_PROJECT_ID: z.string().optional().default('trdmxjurfvzhjeqmaoir'),
  SUPABASE_URL: z.string().optional().default('https://trdmxjurfvzhjeqmaoir.supabase.co'),
  SUPABASE_ANON_KEY: z.string().optional().default('sb_publishable_fj0say5boQ4hd_TTkHQUCw_2jf1Ww6Y'),

  DISABLE_HMR: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        return lower === 'true' || lower === '1';
      }
      return Boolean(val);
    }, z.boolean())
    .default(false),
});

/**
 * Validated, fully resolved and strictly typed application environment interface.
 */
export interface AppEnv extends z.infer<typeof rawEnvSchema> {
  APP_URL: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

/**
 * Validates environment variables from process.env (or an optional custom dictionary)
 * and returns a frozen, typed AppEnv object.
 *
 * @throws {EnvValidationError} If any required variables (e.g. GEMINI_API_KEY, APP_URL, NODE_ENV)
 *                              are missing or fail schema validation.
 */
export function validateEnv(customSource?: Record<string, string | undefined>): AppEnv {
  // Extract values for all known schema keys
  const rawDict: Record<string, any> = {
    NODE_ENV: getRawValue('NODE_ENV', customSource),
    PORT: getRawValue('PORT', customSource),
    APP_URL: getRawValue('APP_URL', customSource),
    GEMINI_API_KEY: getRawValue('GEMINI_API_KEY', customSource),
    SESSION_SECRET: getRawValue('SESSION_SECRET', customSource),
    NOTIFICATION_PROVIDER: getRawValue('NOTIFICATION_PROVIDER', customSource),
    NOTIFICATION_FROM_EMAIL: getRawValue('NOTIFICATION_FROM_EMAIL', customSource),
    RESEND_API_KEY: getRawValue('RESEND_API_KEY', customSource),
    SMTP_HOST: getRawValue('SMTP_HOST', customSource),
    SMTP_PORT: getRawValue('SMTP_PORT', customSource),
    SMTP_USER: getRawValue('SMTP_USER', customSource),
    SMTP_PASS: getRawValue('SMTP_PASS', customSource),
    ENABLE_ONLINE_DEPOSITS: getRawValue('ENABLE_ONLINE_DEPOSITS', customSource),
    STRIPE_SECRET_KEY: getRawValue('STRIPE_SECRET_KEY', customSource),
    STRIPE_WEBHOOK_SECRET: getRawValue('STRIPE_WEBHOOK_SECRET', customSource),
    SUPABASE_PROJECT_ID: getRawValue('SUPABASE_PROJECT_ID', customSource),
    SUPABASE_URL: getRawValue('SUPABASE_URL', customSource),
    SUPABASE_ANON_KEY: getRawValue('SUPABASE_ANON_KEY', customSource),
    DISABLE_HMR: getRawValue('DISABLE_HMR', customSource),
  };

  // Remove undefined fields so Zod defaults can apply cleanly
  Object.keys(rawDict).forEach((key) => {
    if (rawDict[key] === undefined) {
      delete rawDict[key];
    }
  });

  const parsed = rawEnvSchema.safeParse(rawDict);
  const errors: EnvErrorDetail[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] ? String(issue.path[0]) : 'UNKNOWN';
      let tip: string | undefined;

      switch (field) {
        case 'GEMINI_API_KEY':
          tip = 'Provide a valid Gemini API key in your .env file (GEMINI_API_KEY="AIza...") or through AI Studio settings.';
          break;
        case 'APP_URL':
          tip = 'Set APP_URL in .env to the base URL of your application (e.g. APP_URL="http://localhost:3000").';
          break;
        case 'NODE_ENV':
          tip = 'Set NODE_ENV="development" or NODE_ENV="production" in your .env file.';
          break;
        case 'PORT':
          tip = 'Set PORT=3000 (or another integer between 1 and 65535) in your .env file.';
          break;
        default:
          tip = `Ensure ${field} is configured correctly in .env.`;
      }

      errors.push({
        variable: field,
        message: issue.message,
        tip,
      });
    }
  }

  // Cross-field conditional validation checks
  const data = parsed.success ? parsed.data : (rawDict as any);

  // 1. Session secret production enforcement
  if (data.NODE_ENV === 'production') {
    if (!data.SESSION_SECRET || data.SESSION_SECRET.trim() === '') {
      errors.push({
        variable: 'SESSION_SECRET',
        message: 'SESSION_SECRET is required in production mode.',
        tip: 'Set a strong cryptographic secret (at least 16 characters) for SESSION_SECRET in production.',
      });
    } else if (data.SESSION_SECRET.length < 16) {
      errors.push({
        variable: 'SESSION_SECRET',
        message: 'SESSION_SECRET must be at least 16 characters in production mode.',
        tip: 'Generate a longer random key for SESSION_SECRET.',
      });
    }
  }

  // 2. Resend provider requirement
  if (data.NOTIFICATION_PROVIDER === 'resend') {
    if (!data.RESEND_API_KEY || data.RESEND_API_KEY.trim() === '') {
      errors.push({
        variable: 'RESEND_API_KEY',
        message: 'RESEND_API_KEY is required when NOTIFICATION_PROVIDER is set to "resend".',
        tip: 'Set RESEND_API_KEY in .env (e.g. re_12345) or change NOTIFICATION_PROVIDER="console".',
      });
    }
  }

  // 3. SMTP provider requirement
  if (data.NOTIFICATION_PROVIDER === 'smtp') {
    if (!data.SMTP_HOST || data.SMTP_HOST.trim() === '') {
      errors.push({
        variable: 'SMTP_HOST',
        message: 'SMTP_HOST is required when NOTIFICATION_PROVIDER is set to "smtp".',
        tip: 'Set SMTP_HOST in .env (e.g. smtp.sendgrid.net) or change NOTIFICATION_PROVIDER="console".',
      });
    }
  }

  // 4. Online deposits stripe keys requirement
  if (data.ENABLE_ONLINE_DEPOSITS === true) {
    if (!data.STRIPE_SECRET_KEY || data.STRIPE_SECRET_KEY.trim() === '') {
      errors.push({
        variable: 'STRIPE_SECRET_KEY',
        message: 'STRIPE_SECRET_KEY is required when ENABLE_ONLINE_DEPOSITS is enabled.',
        tip: 'Provide your Stripe secret key (sk_test_... or sk_live_...) in .env.',
      });
    }
    if (!data.STRIPE_WEBHOOK_SECRET || data.STRIPE_WEBHOOK_SECRET.trim() === '') {
      errors.push({
        variable: 'STRIPE_WEBHOOK_SECRET',
        message: 'STRIPE_WEBHOOK_SECRET is required when ENABLE_ONLINE_DEPOSITS is enabled.',
        tip: 'Provide your Stripe webhook secret (whsec_...) in .env.',
      });
    }
  }

  if (!parsed.success || errors.length > 0) {
    throw new EnvValidationError(errors);
  }

  const validData = parsed.data;
  const cleanAppUrl = validData.APP_URL.replace(/\/+$/, '');

  return Object.freeze({
    ...validData,
    APP_URL: cleanAppUrl,
    isProduction: validData.NODE_ENV === 'production',
    isDevelopment: validData.NODE_ENV === 'development',
    isTest: validData.NODE_ENV === 'test',
  });
}

/**
 * Singleton cache for validated environment configuration.
 */
let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Pre-validated, strictly-typed environment configuration.
 * Validates automatically at application startup upon module evaluation.
 */
export const env: AppEnv = (() => {
  try {
    return getEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // In development or server startup, print formatted diagnostic message
      console.error(error.message);
    }
    throw error;
  }
})();

export default env;
