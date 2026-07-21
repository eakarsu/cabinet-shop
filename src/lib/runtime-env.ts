function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required in production.`);
  return value;
}

export function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== "production") return;
  const database = required("DATABASE_URL");
  if (!database.startsWith("postgresql://") && !database.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must use PostgreSQL in production.");
  }
  const appUrl = new URL(required("NEXTAUTH_URL"));
  if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") {
    throw new Error("NEXTAUTH_URL must use HTTPS in production.");
  }
  const authSecret = required("NEXTAUTH_SECRET");
  const internalToken = required("INTERNAL_API_TOKEN");
  const privacySecret = required("PRIVACY_HASH_SECRET");
  for (const [name, value] of [
    ["NEXTAUTH_SECRET", authSecret],
    ["INTERNAL_API_TOKEN", internalToken],
    ["PRIVACY_HASH_SECRET", privacySecret],
  ] as const) {
    if (value.length < 32 || /change|example|dummy|development|secret-change/i.test(value)) {
      throw new Error(`${name} must be an independent high-entropy value of at least 32 characters.`);
    }
  }
  if (new Set([authSecret, internalToken, privacySecret]).size !== 3) {
    throw new Error("Authentication, internal API, and privacy hashing secrets must be different.");
  }
}

validateProductionEnvironment();

