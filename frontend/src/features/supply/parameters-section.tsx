import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { SupplyParameter } from "@/types/supply";
import { parameterRows } from "./parameters-model";

const SHOWN = 8;

/** The attributes distributors list for the part. Known ones come first, in one vocabulary; the text is the distributor's own. */
export function ParametersSection({ parameters }: { parameters: SupplyParameter[] }) {
  const [all, setAll] = useState(false);
  if (parameters.length === 0) return null;
  const rows = parameterRows(parameters);
  const shown = all ? rows : rows.slice(0, SHOWN);

  return (
    <section aria-label="Parameters" className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parameters</h3>
      <dl className="grid grid-cols-[minmax(0,12rem)_1fr] gap-x-3 gap-y-0.5 text-sm">
        {shown.map((row) => (
          <div key={`${row.name}:${row.raw}`} className="contents">
            <dt className="truncate text-muted-foreground" title={row.name}>{row.label}</dt>
            <dd>
              {row.raw}
              {row.si ? <span className="ml-2 text-xs text-muted-foreground">{row.si}</span> : null}
              <span className="ml-2 text-xs text-muted-foreground">{row.sources}</span>
            </dd>
          </div>
        ))}
      </dl>
      {rows.length > SHOWN ? (
        <Button size="sm" variant="ghost" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${rows.length}`}</Button>
      ) : null}
    </section>
  );
}
