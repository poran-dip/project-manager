/** Reads an environment variable, throwing if it's missing or empty. */
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }

  return value;
}
