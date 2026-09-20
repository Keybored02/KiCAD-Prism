/**
 * Signing in with the sign-in the KiCad agent already has.
 *
 * KiCad's Remote Symbols panel is an embedded browser with its own cookie jar, so it
 * meets Prism with no session and asks for a login the user has already done in the
 * plugin. That browser can reach the local agent, so the login page offers to use it.
 *
 * The agent binds a preferred port per profile and falls back to an ephemeral one when
 * it is taken, which a page cannot discover. So we try the known ports and give up
 * quietly: no agent, a busy port, or a different machine all just mean the normal
 * login, which is what the page would have shown anyway.
 *
 * Nothing here is trusted. The agent does the token exchange itself and the backend
 * decides whether its sign-in is still valid, so the worst a wrong answer can do is
 * fail to offer a shortcut.
 */

// release, dev. See tools/prism_agent/profiles.py.
const AGENT_PORTS = [48730, 48731];

// Short: the agent is on loopback, so it answers immediately or it is not there. A
// long wait would stall the login page for everyone without an agent.
const TIMEOUT_MS = 600;

export interface AgentSignIn {
  /** The port that answered, so the sign-in call does not probe again. */
  port: number;
  email: string;
  name: string;
}

async function ask(
  port: number,
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Response> {
  return fetch(`http://127.0.0.1:${port}/kicad-signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

/**
 * Who, if anyone, the local agent is signed in as. Null when there is nothing to
 * offer, which is the common case and never an error worth showing.
 */
export async function findAgentSignIn(): Promise<AgentSignIn | null> {
  for (const port of AGENT_PORTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await ask(
        port,
        { identity_only: true, next_url: window.location.origin + "/" },
        controller.signal,
      );
      if (!response.ok) continue;
      const data = await response.json();
      if (data?.email) return { port, email: data.email, name: data.name || data.email };
    } catch {
      // Not there, refused, or timed out. Try the next port.
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/**
 * Ask the agent for a one-shot URL that lands on `nextPath` already signed in.
 *
 * The URL is minted by the backend and consumed once, so it cannot be replayed. Throws
 * when the agent's sign-in is no longer good, which the caller shows as a message and
 * then falls back to the normal login.
 */
export async function startAgentSignIn(port: number, nextPath: string): Promise<string> {
  const nextUrl = new URL(nextPath || "/", window.location.origin).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS * 10);
  try {
    const response = await ask(port, { next_url: nextUrl }, controller.signal);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.nonce_url) {
      throw new Error(data?.error || "The agent could not sign you in.");
    }
    return data.nonce_url as string;
  } finally {
    clearTimeout(timer);
  }
}
