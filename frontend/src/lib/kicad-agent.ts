/**
 * Reaching the KiCad agent from the Remote Symbols panel.
 *
 * The agent binds a preferred port per profile and falls back to an ephemeral one when
 * it is taken, which a page cannot discover. So callers try the known ports and treat
 * silence as "no agent here".
 */

// release, dev. See tools/prism_agent/profiles.py.
export const AGENT_PORTS = [48730, 48731];

// The agent is on loopback, so it answers quickly or it is not there.
const OPEN_TIMEOUT_MS = 2000;

/**
 * Ask the agent to open `url` in the user's own browser.
 *
 * KiCad's webview keeps every navigation and most sites refuse to be framed, so the panel
 * cannot show an outside page itself. Resolves false when no agent opened it (not running,
 * an older agent without the route, a different server, too many links at once), and the
 * caller then falls back to copying the address.
 */
export async function openInSystemBrowser(url: string): Promise<boolean> {
  for (const port of AGENT_PORTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OPEN_TIMEOUT_MS);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/open-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      if (response.ok) return true;
      // 403 or 404 means another profile's agent, or an old one: the next port may do better.
      // Anything else (429, 502) is this agent's real answer.
      if (response.status !== 403 && response.status !== 404) return false;
    } catch {
      // Nothing there, refused, or timed out. Try the next port.
    } finally {
      clearTimeout(timer);
    }
  }
  return false;
}
