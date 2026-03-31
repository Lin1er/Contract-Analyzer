// Environment variable validation
// This runs at build time and server startup to ensure all required env vars are set

interface EnvConfig {
  GEMINI_API_KEY: string;
}

function validateEnv(): EnvConfig {
  const missingVars: string[] = [];

  // Required environment variables
  const requiredVars = ['GEMINI_API_KEY'] as const;

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join('\n')}\n\nPlease check your .env.local file or environment configuration.`
    );
  }

  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  };
}

// Export validated environment (lazy evaluation)
let _env: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

// For checking if env is configured (without throwing)
export function isEnvConfigured(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}
