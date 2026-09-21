/**
 * Signing in with the sign-in the KiCad agent already has.
 *
 * KiCad's Remote Symbols panel is an embedded browser with its own cookie jar, so it
 * meets Prism with no session and asks for a login the user has already done in the
 * plugin. That browser can reach the local agent, so the panel offers to use it.
 *
 * The agent binds a preferred port per profile and falls back to an ephemeral one when
 * it is taken, which a page cannot discover. So we try the known ports and give up
 * quietly: no agent, a busy port, or a different machine all just mean the normal
 * login, which is what the panel would have shown anyway.
 *
 * Nothing here is trusted. The agent does the token exchange itself and the backend
 * decides whether its sign-in is still valid, so the worst a wrong answer can do is
 * fail to offer a shortcut.
 */

// release, dev. See tools/prism_agent/profiles.py.
const AGENT_PORTS = [48730, 48731];

// The agent is on loopback, so it answers quickly or it is not there. This only has to
// outlast the backend round-trip the agent makes to mint the URL.
const TIMEOUT_MS = 6000;

/**
 * Ask the agent for a one-shot URL that lands on `nextPath` already signed in.
 *
 * The URL is minted by the backend and consumed once, so it cannot be replayed. Throws
 * when no agent answers or its sign-in is no longer good, which the caller shows as a
 * message and then falls back to the normal login.
 */
export async function startAgentSignIn(nextPath: string): Promise<string> {
  const nextUrl = new URL(nextPath || "/", window.location.origin).toString();
  let lastError = "";

  for (const port of AGENT_PORTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/kicad-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next_url: nextUrl }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.nonce_url) return data.nonce_url as string;
      // An agent answered but cannot help: not signed in, or its token expired.
      // Worth reporting, unlike a port with nothing behind it.
      if (data?.error) lastError = data.error;
    } catch {
      // Not there, refused, or timed out. Try the next port.
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(lastError || "No signed-in KiCad plugin found on this machine.");
}
