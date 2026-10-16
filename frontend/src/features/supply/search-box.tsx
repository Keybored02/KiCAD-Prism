import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** A search field that searches on submit. Remount it (a new key) to reset the text. */
export function SearchBox({ initial, onSearch, label = "Search parts", placeholder = "Part number or manufacturer" }: {
  initial: string;
  onSearch: (text: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(initial);
  return (
    <form
      className="flex items-center gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(text.trim());
      }}
    >
      <Input aria-label={label} className="h-8 w-64" placeholder={placeholder} value={text} onChange={(event) => setText(event.target.value)} />
      <Button type="submit" size="sm" variant="outline"><Search className="h-4 w-4" />Search</Button>
    </form>
  );
}
