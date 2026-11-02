import { useState } from "react";

import { Button } from "@/components/ui/button";
import { checkRemote } from "@/lib/kicad-libraries-client";
import type { RemoteCheckResult } from "@/types/kicad-libraries";

interface RemoteCheckProps {
    git: string;
    gitRef: string;
    /** Pick a tag or branch the repository offered. */
    onPick: (ref: string) => void;
}

/** Asks the server whether the repository answers and whether the ref exists, before anything is saved. */
export function RemoteCheck({ git, gitRef, onPick }: RemoteCheckProps) {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<RemoteCheckResult | null>(null);
    const [failure, setFailure] = useState<string | null>(null);

    const run = async () => {
        setChecking(true);
        setFailure(null);
        try {
            setResult(await checkRemote(git.trim(), gitRef.trim()));
        } catch (error) {
            setResult(null);
            setFailure(error instanceof Error ? error.message : "Failed to check the repository");
        } finally {
            setChecking(false);
        }
    };

    const offered = result?.reachable ? [...result.tags.slice(-8).reverse(), ...result.branches.slice(0, 3)] : [];

    return (
        <div className="flex flex-col gap-2">
            <div>
                <Button type="button" size="sm" variant="outline" disabled={checking || !git.trim()} onClick={() => void run()}>
                    {checking ? "Checking" : "Check repository"}
                </Button>
            </div>
            {failure && <p className="text-sm text-destructive">{failure}</p>}
            {result && !result.reachable && <p className="text-sm text-destructive">{result.error}</p>}
            {result?.reachable && (
                <div className="flex flex-col gap-1 text-sm">
                    {result.refFound === true && <p className="text-success">Found {gitRef.trim()}.</p>}
                    {result.refFound === false && <p className="text-destructive">No tag or branch named {gitRef.trim()}.</p>}
                    {offered.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-xs text-muted-foreground">Tags and branches:</span>
                            {offered.map((name) => (
                                <Button key={name} type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => onPick(name)}>
                                    {name}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
