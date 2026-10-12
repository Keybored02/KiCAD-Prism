import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

/**
 * After a DigiKey sign-in the server sends the browser back with `signin=ok` or `signin=failed&message=...`.
 * Say how it went once, then take the result out of the address so a reload does not say it again.
 */
export function useSigninResult(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const result = searchParams.get("signin");
  const message = searchParams.get("message") ?? "";

  useEffect(() => {
    if (!result) return;
    if (result === "ok") toast.success("Signed in at DigiKey", { description: "Change notices will be read with the next polls." });
    else toast.error("The DigiKey sign-in did not finish", message ? { description: message } : undefined);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("signin");
      next.delete("message");
      return next;
    }, { replace: true });
  }, [result, message, setSearchParams]);
}
