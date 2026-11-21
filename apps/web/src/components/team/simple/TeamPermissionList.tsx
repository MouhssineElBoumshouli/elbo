// team-layer: simple mode's permissions menu, a list with each mode's name and what it does,
// in place of upstream's row of four icons. Lives inside the same Menu, so a pick closes it.
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type { RuntimeMode } from "@t3tools/contracts";
import { CheckIcon, type LucideIcon } from "lucide-react";

interface Option {
  readonly mode: RuntimeMode;
  readonly icon: LucideIcon;
  readonly disabledReason?: string;
}

const ACCESS_WORDS: Readonly<Record<RuntimeMode, { label: string; description: string }>> = {
  "approval-required": {
    label: "Ask for everything",
    description: "Asks before it runs a command or changes a file.",
  },
  "auto-accept-edits": {
    label: "Ask before commands",
    description: "Changes files on its own, asks before it runs a command.",
  },
  auto: {
    label: "Auto",
    description: "Does routine steps on its own, asks about the rest.",
  },
  "full-access": {
    label: "Full access",
    description: "Runs commands and changes files without asking.",
  },
};

export const teamAccessLabel = (mode: RuntimeMode): string => ACCESS_WORDS[mode].label;

export function TeamPermissionList(props: {
  readonly runtimeMode: RuntimeMode;
  readonly options: ReadonlyArray<Option>;
  readonly onChange: (mode: RuntimeMode) => void;
}) {
  return (
    <div data-composer-permissions className="grid w-80 gap-1 px-1 py-1">
      <div className="px-2 pt-0.5 text-xs font-medium text-muted-foreground">
        What the AI may do
      </div>
      <MenuPrimitive.RadioGroup
        aria-label="Permissions"
        value={props.runtimeMode}
        onValueChange={(value: RuntimeMode) => {
          if (value !== props.runtimeMode) props.onChange(value);
        }}
        className="grid gap-0.5"
      >
        {props.options.map((option) => {
          const Icon = option.icon;
          const words = ACCESS_WORDS[option.mode];
          return (
            <MenuPrimitive.RadioItem
              key={option.mode}
              value={option.mode}
              label={words.label}
              disabled={option.disabledReason !== undefined}
              closeOnClick
              className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-start outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40 data-highlighted:bg-accent"
            >
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="text-sm text-foreground">{words.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.disabledReason ?? words.description}
                </span>
              </span>
              <MenuPrimitive.RadioItemIndicator className="mt-0.5 shrink-0">
                <CheckIcon aria-hidden="true" className="size-4" />
              </MenuPrimitive.RadioItemIndicator>
            </MenuPrimitive.RadioItem>
          );
        })}
      </MenuPrimitive.RadioGroup>
    </div>
  );
}
