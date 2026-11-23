// team-layer: the planning questions on one screen (team/PLANNING_FEATURE_PLAN.md section 4, slice 4).
import type { TeamMember } from "@t3tools/contracts";
import type { ReactNode } from "react";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Toggle } from "../../ui/toggle";
import {
  AI_CHOICES,
  BUDGET_CHOICES,
  type DeadlineUnit,
  FEEL_CHOICES,
  hoursPerWeek,
  type PlanAnswers,
  type PlanPersonAnswer,
  type PlanQuestionId,
  USER_CHOICES,
} from "./planAnswers.logic";

const NOT_IN_ELBO = "not-in-elbo";

function Question(props: {
  readonly number: number;
  readonly title: string;
  readonly id?: PlanQuestionId;
  readonly answers: PlanAnswers;
  readonly onNotSure?: (id: PlanQuestionId, on: boolean) => void;
  readonly children: ReactNode;
}) {
  const notSure = props.id !== undefined && props.answers.notSure.includes(props.id);
  return (
    <section className="grid grid-cols-[1.5rem_1fr] gap-x-2 gap-y-2" aria-label={props.title}>
      <span className="pt-0.5 text-sm text-muted-foreground">{props.number}</span>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="grow text-sm font-semibold">{props.title}</h3>
          {props.id !== undefined && props.onNotSure ? (
            <Toggle
              variant="ghost"
              size="xs"
              pressed={notSure}
              onPressedChange={(on) => props.onNotSure?.(props.id!, on)}
            >
              Not sure, suggest something
            </Toggle>
          ) : null}
        </div>
        <div className={notSure ? "pointer-events-none opacity-50" : undefined}>
          {props.children}
        </div>
      </div>
    </section>
  );
}

function Choices(props: {
  readonly choices: ReadonlyArray<string>;
  readonly picked: ReadonlyArray<string>;
  readonly onChange: (picked: ReadonlyArray<string>) => void;
  readonly single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.choices.map((choice) => (
        <Toggle
          key={choice}
          variant="outline"
          size="sm"
          pressed={props.picked.includes(choice)}
          onPressedChange={(on) =>
            props.onChange(
              props.single
                ? on
                  ? [choice]
                  : []
                : on
                  ? [...props.picked, choice]
                  : props.picked.filter((item) => item !== choice),
            )
          }
        >
          {choice}
        </Toggle>
      ))}
    </div>
  );
}

function PersonRow(props: {
  readonly person: PlanPersonAnswer;
  readonly index: number;
  readonly members: ReadonlyArray<TeamMember> | null;
  readonly perWeek: boolean;
  readonly onChange: (person: PlanPersonAnswer) => void;
  readonly onRemove: () => void;
}) {
  const { person } = props;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {props.members === null ? (
        <span className="min-w-24 text-sm font-medium">{person.name}</span>
      ) : (
        <>
          <Select
            value={person.memberId ?? NOT_IN_ELBO}
            onValueChange={(value) => {
              const member = props.members?.find((entry) => entry.memberId === value);
              props.onChange(
                member === undefined
                  ? { ...person, memberId: null, name: "" }
                  : { ...person, memberId: member.memberId, name: member.displayName },
              );
            }}
          >
            <SelectTrigger size="sm" className="w-44" aria-label={`Person ${props.index + 1}`}>
              <SelectValue>
                {person.memberId === null ? "Not in Elbo yet" : person.name}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {props.members.map((member) => (
                <SelectItem key={member.memberId} value={member.memberId}>
                  {member.displayName}
                </SelectItem>
              ))}
              <SelectItem value={NOT_IN_ELBO}>Not in Elbo yet</SelectItem>
            </SelectPopup>
          </Select>
          {person.memberId === null ? (
            <Input
              size="sm"
              className="w-36"
              placeholder="Their name"
              aria-label={`Person ${props.index + 1} name`}
              value={person.name}
              onChange={(event) => props.onChange({ ...person, name: event.target.value })}
            />
          ) : null}
        </>
      )}
      <Input
        size="sm"
        className="w-56"
        placeholder="What they know: Python, never coded…"
        aria-label={`${person.name || `Person ${props.index + 1}`} knows`}
        value={person.skills}
        onChange={(event) => props.onChange({ ...person, skills: event.target.value })}
      />
      <Input
        size="sm"
        type="number"
        min={0}
        className="w-24"
        placeholder="Hours"
        aria-label={`${person.name || `Person ${props.index + 1}`} hours ${props.perWeek ? "a week" : "in total"}`}
        value={person.hours}
        onChange={(event) => props.onChange({ ...person, hours: event.target.value })}
      />
      <span className="text-xs text-muted-foreground">
        {props.perWeek ? "hours a week" : "hours in total"}
      </span>
      {props.members !== null ? (
        <Button size="xs" variant="ghost" onClick={props.onRemove}>
          Remove
        </Button>
      ) : null}
    </div>
  );
}

/** Every question on one screen; empty or "not sure" answers are left for the AI to suggest. */
export function PlanQuestions(props: {
  readonly answers: PlanAnswers;
  /** The Elbo team's members, or null for a solo project (just you). */
  readonly members: ReadonlyArray<TeamMember> | null;
  readonly onChange: (answers: PlanAnswers) => void;
}) {
  const { answers } = props;
  const set = (patch: Partial<PlanAnswers>) => props.onChange({ ...answers, ...patch });
  const setNotSure = (id: PlanQuestionId, on: boolean) =>
    set({
      notSure: on ? [...answers.notSure, id] : answers.notSure.filter((item) => item !== id),
    });
  const ask = { answers, onNotSure: setNotSure };
  const perWeek = hoursPerWeek(answers);

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card p-5">
      <Question number={1} title="What are you making, in one or two sentences?" id="what" {...ask}>
        <Textarea
          rows={2}
          value={answers.what}
          aria-label="What are you making"
          onChange={(event) => set({ what: event.target.value })}
        />
      </Question>
      <Question number={2} title="Who will use it?" id="users" {...ask}>
        <Choices
          choices={USER_CHOICES}
          picked={answers.users}
          onChange={(users) => set({ users })}
        />
      </Question>
      <Question number={3} title="What must it do on day one? (up to 5)" id="mustHaves" {...ask}>
        <div className="flex flex-col gap-1.5">
          {answers.mustHaves.map((line, index) => (
            <Input
              // The lines are fixed slots, so their order is their identity.
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              size="sm"
              aria-label={`Must-have ${index + 1}`}
              value={line}
              onChange={(event) =>
                set({
                  mustHaves: answers.mustHaves.map((item, at) =>
                    at === index ? event.target.value : item,
                  ),
                })
              }
            />
          ))}
        </div>
      </Question>
      <Question number={4} title="What would be nice, but can wait?" id="niceToHaves" {...ask}>
        <Textarea
          rows={2}
          placeholder="One per line"
          aria-label="Nice to have"
          value={answers.niceToHaves}
          onChange={(event) => set({ niceToHaves: event.target.value })}
        />
      </Question>
      <Question number={5} title="When is the deadline?" id="deadline" {...ask}>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            size="sm"
            type="number"
            min={1}
            className="w-24"
            aria-label="Deadline amount"
            value={answers.deadlineAmount}
            onChange={(event) => set({ deadlineAmount: event.target.value })}
          />
          <Choices
            single
            choices={["days", "weeks", "months"]}
            picked={[answers.deadlineUnit]}
            onChange={(picked) =>
              set({ deadlineUnit: (picked[0] as DeadlineUnit | undefined) ?? "weeks" })
            }
          />
        </div>
      </Question>
      <Question number={6} title="Who is on the team, and what does each person know?" {...ask}>
        <div className="flex flex-col gap-2">
          {answers.people.map((person, index) => (
            <PersonRow
              // A row is a slot the person fills in; its place is its identity.
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              person={person}
              index={index}
              members={props.members}
              perWeek={perWeek}
              onChange={(next) =>
                set({ people: answers.people.map((item, at) => (at === index ? next : item)) })
              }
              onRemove={() => set({ people: answers.people.filter((_, at) => at !== index) })}
            />
          ))}
          {props.members !== null ? (
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  set({
                    people: [
                      ...answers.people,
                      { name: "", memberId: null, skills: "", hours: "" },
                    ],
                  })
                }
              >
                Add a person
              </Button>
            </div>
          ) : null}
        </div>
      </Question>
      <Question number={7} title="Budget for hosting and services?" id="budget" {...ask}>
        <Choices
          single
          choices={BUDGET_CHOICES}
          picked={[answers.budget]}
          onChange={(picked) => set({ budget: picked[0] ?? "" })}
        />
      </Question>
      <Question number={8} title="Any rules from outside?" id="outsideRules" {...ask}>
        <Textarea
          rows={2}
          placeholder="A teacher requires Java, student data stays in the EU…"
          aria-label="Rules from outside"
          value={answers.outsideRules}
          onChange={(event) => set({ outsideRules: event.target.value })}
        />
      </Question>
      <Question number={9} title="Is there AI in it?" id="ai" {...ask}>
        <Choices
          single
          choices={AI_CHOICES}
          picked={[answers.ai]}
          onChange={(picked) => set({ ai: picked[0] ?? "" })}
        />
      </Question>
      <Question number={10} title="How should it feel?" id="feel" {...ask}>
        <div className="flex flex-wrap items-center gap-2">
          <Choices
            single
            choices={FEEL_CHOICES}
            picked={[answers.feel]}
            onChange={(picked) => set({ feel: picked[0] ?? "" })}
          />
          <Input
            size="sm"
            className="w-56"
            placeholder="Or a word, or a site you like"
            aria-label="How it should feel"
            value={
              FEEL_CHOICES.includes(answers.feel as (typeof FEEL_CHOICES)[number])
                ? ""
                : answers.feel
            }
            onChange={(event) => set({ feel: event.target.value })}
          />
        </div>
      </Question>
      <Question number={11} title="Anything else we should know?" {...ask}>
        <Textarea
          rows={2}
          aria-label="Anything else"
          value={answers.notes}
          onChange={(event) => set({ notes: event.target.value })}
        />
      </Question>
    </div>
  );
}
