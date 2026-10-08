import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Command, CommandEmpty, CommandGroup, CommandInput,
    CommandItem, CommandList,
} from "@/components/ui/command";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export function MultiSelect({
    options,
    value,
    onChange,
    placeholder = "Select…",
    allowCustom = true,
}: {
    options: readonly string[];
    value: string[];
    onChange: (v: string[]) => void;
    placeholder?: string;
    allowCustom?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const toggle = (item: string) =>
        onChange(
            value.includes(item) ? value.filter((v) => v !== item) : [...value, item]
        );

    const addCustom = () => {
        const v = query.trim();
        if (v && !value.includes(v)) onChange([...value, v]);
        setQuery("");
    };

    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="secondary"
                        role="combobox"
                        className="w-full h-11 rounded-2xl justify-between font-normal"
                    >
                        <span className="truncate text-left">
                            {value.length ? `${value.length} selected` : placeholder}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search…"
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {allowCustom && query ? (
                                    <button
                                        type="button"
                                        className="w-full text-left px-2 py-1.5 text-sm"
                                        onClick={addCustom}
                                    >
                                        Add "{query}"
                                    </button>
                                ) : (
                                    "No results"
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((opt) => (
                                    <CommandItem
                                        key={opt}
                                        value={opt}
                                        onSelect={() => toggle(opt)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value.includes(opt) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {opt}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {value.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {value.map((v) => (
                        <Badge key={v} variant="secondary" className="gap-1 rounded-full">
                            {v}
                            <button type="button" onClick={() => toggle(v)}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}