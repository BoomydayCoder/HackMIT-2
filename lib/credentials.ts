export type Credentials = { username: string; password: string };

/** Pulls a username/password pair out of a JSON request body, or null if either is missing. */
export async function readCredentials(request: Request): Promise<Credentials | null> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    return username && password ? { username, password } : null;
  } catch {
    return null;
  }
}
