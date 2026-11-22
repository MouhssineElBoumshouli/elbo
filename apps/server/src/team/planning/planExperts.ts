import * as Schema from "effect/Schema";

export const PlanSize = Schema.Literals(["small", "medium", "large"]);
export type PlanSize = typeof PlanSize.Type;

export const ExpertId = Schema.Literals([
  "project-manager",
  "architect",
  "security",
  "designer",
  "ai-engineer",
  "research",
  "hackathon",
  "ml",
  "mobile",
]);
export type ExpertId = typeof ExpertId.Type;

export const PlanKind = Schema.Literals([
  "app",
  "website",
  "hackathon",
  "research",
  "ml",
  "mobile",
  "other",
]);
export type PlanKind = typeof PlanKind.Type;

/** The expert a kind of project always gets a seat for. */
const KIND_EXPERT: Partial<Record<PlanKind, ExpertId>> = {
  hackathon: "hackathon",
  research: "research",
  ml: "ml",
  mobile: "mobile",
};

export const SectionId = Schema.Literals([
  "what",
  "scope",
  "stack",
  "parts",
  "data",
  "security",
  "look",
  "ai",
  "work",
  "risks",
  "extra",
]);
export type SectionId = typeof SectionId.Type;

export const SECTION_TITLES: Record<SectionId, string> = {
  what: "What we build and for whom",
  scope: "Must-haves and later",
  stack: "Stack and why",
  parts: "How the parts fit together",
  data: "Data and privacy",
  security: "Security risks and what we do about them",
  look: "The look and the main screens",
  ai: "AI",
  work: "Who does what, and in what order",
  risks: "Risks",
  extra: "More",
};

interface Expert {
  readonly name: string;
  readonly sections: ReadonlyArray<SectionId>;
  /** Shown as the title of its "extra" section. */
  readonly extraTitle?: string;
}

export const EXPERTS: Record<ExpertId, Expert> = {
  "project-manager": { name: "project manager", sections: ["what", "scope"] },
  architect: { name: "software architect", sections: ["stack", "parts", "data"] },
  security: { name: "security engineer", sections: ["security"] },
  designer: { name: "designer", sections: ["look"] },
  "ai-engineer": { name: "AI engineer", sections: ["ai"] },
  research: {
    name: "research methods expert",
    sections: ["extra"],
    extraTitle: "Research method and ethics",
  },
  hackathon: { name: "pitch and demo coach", sections: ["extra"], extraTitle: "Pitch and demo" },
  ml: { name: "data and ML expert", sections: ["extra"], extraTitle: "Data and model" },
  mobile: { name: "mobile expert", sections: ["extra"], extraTitle: "App stores and devices" },
};

/** Small plans keep only these (section 8). */
const SMALL_SECTIONS: ReadonlyArray<SectionId> = ["what", "scope", "stack", "risks", "work"];

const PANEL_LIMITS: Record<PlanSize, { readonly min: number; readonly max: number }> = {
  small: { min: 2, max: 2 },
  medium: { min: 3, max: 4 },
  large: { min: 4, max: 5 },
};

export const REVIEW_ROUNDS: Record<PlanSize, number> = { small: 0, medium: 1, large: 2 };

/** A build this short gets 3 security lines in the architect's checklist instead of a seat. */
const QUICK_BUILD_DAYS = 1;

export interface PanelInput {
  readonly size: PlanSize;
  readonly kind: PlanKind;
  readonly isSoftware: boolean;
  readonly deadlineDays: number;
  readonly requested: ReadonlyArray<ExpertId>;
}

/**
 * The panel the session runs with, in seat order: the project manager, the architect for software,
 * the expert for this kind of project, then the security engineer when the plan is not small and
 * the build is longer than a day. A model's wish list fills what is left, trimmed to the size.
 */
export function normalizePanel(input: PanelInput): ReadonlyArray<ExpertId> {
  const { size, kind, isSoftware, deadlineDays, requested } = input;
  const kindExpert = KIND_EXPERT[kind];
  const securitySeat = isSoftware && size !== "small" && deadlineDays > QUICK_BUILD_DAYS;
  const required: ExpertId[] = ["project-manager"];
  if (isSoftware) required.push("architect");
  if (kindExpert) required.push(kindExpert);
  if (securitySeat) required.push("security");
  const wanted = [...required, ...requested].filter((id, index, all) => all.indexOf(id) === index);
  const { min, max } = PANEL_LIMITS[size];
  const panel = wanted.filter((id) => id !== "security" || securitySeat).slice(0, max);
  const fillers: ExpertId[] = ["architect", "designer"];
  for (const filler of fillers) {
    if (panel.length >= min) break;
    if (!panel.includes(filler)) panel.push(filler);
  }
  return panel;
}

/** A starting point the project manager sees; it may pick another size with a reason. */
export function suggestSize(people: number, hours: number, days: number): PlanSize {
  if (people <= 1 && hours <= 20) return "small";
  if (people >= 3 && days >= 70) return "large";
  return "medium";
}

export const sectionsFor = (panel: ReadonlyArray<ExpertId>, size: PlanSize) => {
  const owned = panel.flatMap((id) => EXPERTS[id].sections);
  const all: SectionId[] = [...owned, "work", "risks"];
  return (size === "small" ? all.filter((id) => SMALL_SECTIONS.includes(id)) : all).filter(
    (id, index, list) => list.indexOf(id) === index,
  );
};
