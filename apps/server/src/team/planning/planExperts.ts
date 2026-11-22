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

/**
 * The panel the session runs with. The project manager always leads; software always gets the
 * architect, and the security engineer when there is room. A model's wish list is trimmed to the size.
 */
export function normalizePanel(
  size: PlanSize,
  isSoftware: boolean,
  requested: ReadonlyArray<ExpertId>,
): ReadonlyArray<ExpertId> {
  const required: ExpertId[] = ["project-manager"];
  if (isSoftware) required.push("architect");
  if (isSoftware && size !== "small") required.push("security");
  const wanted = [...required, ...requested].filter((id, index, all) => all.indexOf(id) === index);
  const { min, max } = PANEL_LIMITS[size];
  const panel = wanted.slice(0, max);
  const fillers: ExpertId[] = ["architect", "designer", "security"];
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
