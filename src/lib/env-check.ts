import "./env"

export function checkEnv() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set. Using default SQLite database.")
  }
  if (!process.env.AUTH_SECRET || (process.env.AUTH_SECRET as string).length < 32) {
    console.warn(
      "AUTH_SECRET is too short or not set. Generate a secure random string (min 32 chars).",
    )
  }
}
