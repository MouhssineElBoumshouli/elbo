/** A mistake planted in a brief. The plan passes when one line names the topic and pushes back. */
export interface PlantedMistake {
  readonly id: string;
  readonly topic: RegExp;
  readonly pushBack: RegExp;
}

export interface PlanCase {
  readonly id: string;
  readonly source: string;
  /** In cases/, the brief the runner reads. */
  readonly briefFile: string;
  readonly onePage: boolean;
  readonly planted: ReadonlyArray<PlantedMistake>;
}

export const planCases: ReadonlyArray<PlanCase> = [
  {
    id: "attendance",
    source: "team/PLANNING_EXAMPLE_ATTENDANCE.md, the hand-written worked example",
    briefFile: "attendance.json",
    onePage: false,
    planted: [],
  },
  {
    id: "weekend-todo",
    source: "team/PLANNING_FEATURE_PLAN.md section 3: a weekend project must get one page",
    briefFile: "weekend-todo.json",
    onePage: true,
    planted: [],
  },
  {
    id: "hackathon-pitch",
    source: "team/PLANNING_FEATURE_PLAN.md section 10: a hackathon pitch in 24 hours",
    briefFile: "hackathon-pitch.json",
    onePage: false,
    planted: [],
  },
  {
    id: "planted-mistakes",
    source: "team/PLANNING_FEATURE_PLAN.md section 10.4: briefs with a bad idea in them",
    briefFile: "planted-mistakes.json",
    onePage: false,
    planted: [
      {
        id: "plain-text-passwords",
        topic: /password/i,
        pushBack:
          /hash|bcrypt|argon2|scrypt|never (store|keep|save)|reset link|plain[- ]text.*(unsafe|risk|never|not)/i,
      },
      {
        id: "microservices",
        topic: /micro-?services|kubernetes|k8s/i,
        pushBack:
          /monolith|(single|one) ([\w/-]+ )?(app|application|service|server|codebase|program|project)\b|overkill|too (much|complex|big|heavy)|not need|instead|drop|skip|avoid|defer|exceeds?\b/i,
      },
      {
        id: "free-tier-photos",
        topic: /500 ?MB|photo|image|10 ?GB|storage/i,
        pushBack:
          /10 ?GB|exceed|too small|(won't|will not|doesn't|does not|cannot|can't) (fit|hold)|not enough|over the (limit|free)|object storage|file storage|bucket|compress|resiz|thumbnail|outside the database|not in the database/i,
      },
    ],
  },
];
