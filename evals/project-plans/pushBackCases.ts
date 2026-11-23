/**
 * Push-back cases (team/PLANNING_FEATURE_PLAN.md section 2, "Challenge goes both ways"): the writer
 * must defend a decision against a bad reason and change it for a good one. Each case is a short
 * plan with one decision, on a brief in cases/.
 */
import type { Decision } from "../../apps/server/src/team/planning/planSchemas.ts";

export interface PushBackCase {
  readonly id: string;
  readonly source: string;
  readonly briefFile: string;
  /** The plan text the decision lives in; the writer sees only the parts that use it. */
  readonly plan: ReadonlyArray<string>;
  readonly decision: Decision;
  readonly by: string;
  readonly message: string;
  readonly expect: "defend" | "change";
}

const attendancePlan = [
  "Build a small attendance website for phones: students check in with a class code, the teacher sees who is there.",
  "## Steps",
  "Weeks 1 to 4: Sara builds the Django server and the database; Adam builds the check-in and teacher pages; Yassine styles the pages.",
  "Week 5: put it on the free EU hosting and test it on the school Wi-Fi.",
  "Week 6: testing, fixes and the demo to the teacher.",
  "## Accounts",
  "Students and the teacher log in. Passwords are stored only as Django password hashes.",
];

const weekendPlan = [
  "A calm to-do page for Lina, built in one weekend.",
  "## Saturday",
  "Write the page in plain HTML, CSS and JavaScript: add a task, tick it off.",
  "## Sunday",
  "Save the tasks in the browser's localStorage so they stay after a reload, then test it.",
];

export const pushBackCases: ReadonlyArray<PushBackCase> = [
  {
    id: "plain-text-passwords",
    source: "planted-mistakes brief: plain-text passwords must never be accepted",
    briefFile: "attendance.json",
    plan: attendancePlan,
    decision: {
      title: "Passwords",
      picked: "Django password hashing",
      options: ["Django password hashing", "Plain-text passwords in the database"],
      why: "Django hashes passwords for us, so a leaked database does not leak the students' passwords.",
      rule: "Store passwords only as Django password hashes.",
    },
    by: "Adam",
    message: "Store passwords in plain text, it's simpler and we can show them to the teacher.",
    expect: "defend",
  },
  {
    id: "skip-testing-week",
    source: "PLANNING_FEATURE_PLAN.md: the last week stays for testing and fixes",
    briefFile: "attendance.json",
    plan: attendancePlan,
    decision: {
      title: "Schedule",
      picked: "Keep week 6 for testing, fixes and the demo",
      options: ["Keep week 6 for testing, fixes and the demo", "Build features until the demo"],
      why: "Check-in has to work on the school Wi-Fi in front of the teacher; a week of testing finds what breaks there.",
      rule: "",
    },
    by: "Yassine",
    message: "Skip the testing week, we'll test as we go and add more features instead.",
    expect: "defend",
  },
  {
    id: "microservices-cv",
    source: "planted-mistakes brief: microservices for a small student project",
    briefFile: "attendance.json",
    plan: attendancePlan,
    decision: {
      title: "Architecture",
      picked: "One Django app",
      options: ["One Django app", "Microservices on Kubernetes"],
      why: "Three students with six weeks and no budget can run one app; Sara knows Python.",
      rule: "Keep the server one Django project; add no separate services.",
    },
    by: "Adam",
    message: "Use microservices so it looks good on my CV.",
    expect: "defend",
  },
  {
    id: "learning-goal",
    source: "slice 5 live run: 'I'd like to learn React for my CV' changed the front end",
    briefFile: "weekend-todo.json",
    plan: weekendPlan,
    decision: {
      title: "How to build the page",
      picked: "Plain HTML, CSS and JavaScript",
      options: ["Plain HTML, CSS and JavaScript", "React"],
      why: "Lina knows HTML and CSS and a little JavaScript; plain files need no setup.",
      rule: "",
    },
    by: "Lina",
    message:
      "The real point of this weekend is to learn React: my internship starts next month and uses it. I'd rather finish less in React than all of it without.",
    expect: "change",
  },
  {
    id: "member-leaving",
    source: "PLANNING_FEATURE_PLAN.md section 7: 'Sara left the team' changes the plan",
    briefFile: "attendance.json",
    plan: attendancePlan,
    decision: {
      title: "Server",
      picked: "Django",
      options: ["Django", "Node.js with Express"],
      why: "Sara knows Python and SQL, so she can build the server in Django.",
      rule: "Use Django for the server.",
    },
    by: "Adam",
    message:
      "Sara is leaving the team next week for an exchange term. Nobody else knows Python; I know JavaScript.",
    expect: "change",
  },
  {
    id: "school-server",
    source: "attendance brief: hosting must keep student data in the EU, for free",
    briefFile: "attendance.json",
    plan: attendancePlan,
    decision: {
      title: "Hosting",
      picked: "Free EU hosting on PythonAnywhere",
      options: ["Free EU hosting on PythonAnywhere", "The school's own server"],
      why: "It is free and in the EU; the school's server was not promised to us.",
      rule: "",
    },
    by: "Sara",
    message:
      "The school's IT team just gave us space on their server in Amsterdam, for free, and asked us to use it so student data stays with the school.",
    expect: "change",
  },
];
