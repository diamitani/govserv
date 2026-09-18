import { getServices } from "./data";
import type { GovService } from "./types";

/**
 * Local GovGuide engine — the default chat brain when no AI_API_KEY or
 * ROSTR_API_URL is configured. Scores the user's text against the services
 * registry and composes a plain-language answer. NEVER invents services:
 * every cited ID is looked up in the registry first.
 *
 * `registry` is injected by the caller (the API route reads it fresh from
 * disk); it defaults to the bundled registry for safety.
 */

const STOP = new Set([
  "the","a","an","and","or","to","of","in","on","for","with","is","are","was",
  "were","i","me","my","we","our","you","your","it","its","this","that","these",
  "those","at","by","from","as","be","have","has","had","do","does","did","can",
  "could","should","would","will","need","needs","needed","get","getting","got",
  "how","what","where","when","why","who","which","there","their","them","they",
  "he","she","his","her","im","ive","dont","doesnt","cant","wont","about","into",
  "out","up","down","over","under","more","very","just","like","want","wants",
  "help","please","thanks","thank","hi","hey","hello","yo","ok","okay","so",
]);

// Intent → boosted service IDs + extra keywords
const INTENTS: { ids: string[]; keywords: string[] }[] = [
  { ids: ["chi-dfss-rent", "il-ihda-housing", "chi-cha-hcv"], keywords: ["rent", "rental", "evict", "eviction", "landlord", "apartment", "lease", "homeless", "housing", "behind on rent", "pay rent"] },
  { ids: ["il-dhs-snap", "il-dhs-wic"], keywords: ["food", "groceries", "grocery", "eat", "hungry", "snap", "ebt", "link card", "wic", "pantry"] },
  { ids: ["cook-ceda-liheap", "fed-fcc-lifeline"], keywords: ["electric", "electricity", "utility", "utilities", "gas", "heat", "heating", "comed", "power", "bill", "shutoff", "disconnection", "liheap", "cooling", "air conditioning"] },
  { ids: ["il-hfs-medicaid", "cook-health-carelink", "chi-cdph", "fed-medicare"], keywords: ["health", "doctor", "medical", "hospital", "insurance", "medicaid", "clinic", "prescription", "dentist", "mental health", "pregnant", "pregnancy"] },
  { ids: ["il-ides-ui", "cook-workforce"], keywords: ["unemployment", "job", "jobs", "laid off", "fired", "work", "ides", "benefits", "claim", "certify"] },
  { ids: ["chi-cta-fare"], keywords: ["bus", "train", "cta", "transportation", "transit", "fare", "senior", "ride", "metra", "pace"] },
  { ids: ["cook-legalaid"], keywords: ["lawyer", "legal", "court", "eviction", "sue", "attorney", "rights", "denied", "appeal", "custody", "divorce"] },
  { ids: ["il-dhs-wic", "il-dhs-ccap", "fed-headstart", "chi-early-learning"], keywords: ["baby", "infant", "child", "kids", "pregnant", "breastfeeding", "formula"] },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function scoreService(s: GovService, tokens: string[], intentBoost: Map<string, number>): number {
  const fields = [
    { text: s.name, w: 6 },
    { text: s.agency, w: 3 },
    { text: s.category, w: 4 },
    { text: s.description, w: 2 },
    { text: s.eligibility.join(" "), w: 2 },
    { text: s.prerequisites.join(" "), w: 1 },
  ];
  let score = 0;
  for (const t of tokens) {
    for (const f of fields) {
      if (f.text.toLowerCase().includes(t)) score += f.w;
    }
  }
  // Whole-phrase matches on name/agency get a bonus
  const lower = tokens.join(" ");
  if (lower && s.name.toLowerCase().includes(tokens.join(" "))) score += 8;
  score += intentBoost.get(s.id) ?? 0;
  return score;
}

export interface LocalAnswer {
  reply: string;
  serviceCards: string[];
  actionPlan: string[];
}

function formatDeadline(s: GovService): string {
  const dated = s.deadlines.filter((d) => d.date).sort((a, b) => a.date!.localeCompare(b.date!));
  if (dated.length === 0) return "Rolling application — apply any time";
  return dated.map((d) => `**${d.label}**: ${d.date}${d.note ? ` — ${d.note}` : ""}`).join("; ");
}

function primaryContact(s: GovService): string {
  const phone = s.contacts.find((c) => c.kind === "phone");
  if (phone) return `${phone.label}: ${phone.value}`;
  return `${s.contacts[0]?.label ?? "Contact"}: ${s.contacts[0]?.value ?? ""}`;
}

export function answerLocally(userText: string, services?: GovService[]): LocalAnswer {
  const text = userText.trim();
  const lower = text.toLowerCase();

  // Greetings
  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening)|howdy)\b/.test(lower) && lower.length < 40) {
    return {
      reply:
        "Hello — I'm **GovGuide**, your GovServ assistant. I can help you find government programs and benefits, understand what you're eligible for, and walk you through applying.\n\nTry asking me something like:\n- \"I need help paying rent\"\n- \"Help me apply for SNAP\"\n- \"What should I bring to my appointment?\"",
      serviceCards: [],
      actionPlan: [],
    };
  }

  // Bare "help"
  if (/^(help|help me|what can you do|i need help)$/.test(lower)) {
    return {
      reply:
        "Here's what I can do:\n\n- **Find benefits** — tell me your situation (rent, food, utilities, health, jobs) and I'll match you to programs\n- **Explain eligibility** — what each program requires\n- **Build an action plan** — documents to gather, who to call, and where to apply\n- **Track deadlines** — so nothing slips\n\nWhat's on your mind?",
      serviceCards: [],
      actionPlan: [],
    };
  }

  const tokens = tokenize(text);

  // Intent boosts
  const intentBoost = new Map<string, number>();
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      if (lower.includes(kw)) {
        for (const id of intent.ids) {
          intentBoost.set(id, (intentBoost.get(id) ?? 0) + 10);
        }
      }
    }
  }

  const registry = services ?? getServices();
  const scored = registry
    .map((s) => ({ s, score: scoreService(s, tokens, intentBoost) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // No match
  if (scored.length === 0) {
    return {
      reply:
        "I couldn't match that to a program in my database yet — I currently cover Chicago, Cook County, and Illinois programs for **food, housing, utilities, health, employment, transportation, and legal help**.\n\nCould you tell me a bit more about your situation? For example: \"I lost my job and need help with bills\" or \"My electric bill is past due.\"",
      serviceCards: [],
      actionPlan: [],
    };
  }

  const top = scored.map((x) => x.s);
  const first = top[0];

  let reply = `Based on what you told me, here are the programs most likely to help:\n\n`;
  for (const s of top) {
    reply += `### ${s.name}\n`;
    reply += `${s.description.split(".")[0]}.\n\n`;
    reply += `- **Who it's for:** ${s.eligibility[0]}\n`;
    reply += `- **Deadlines:** ${formatDeadline(s)}\n`;
    reply += `- **Contact:** ${primaryContact(s)}\n\n`;
  }
  reply += `Open any card below for full details, eligibility, and a printable what-to-bring checklist.`;

  const actionPlan: string[] = [];
  const bring = first.whatToBring.slice(0, 3);
  if (bring.length) actionPlan.push(`Gather your documents: ${bring.join("; ")}.`);
  actionPlan.push(`Contact ${first.agency} — ${primaryContact(first)}.`);
  const apply = first.applyLinks[0];
  if (apply) actionPlan.push(`Apply at: ${apply.label} (${apply.url}).`);
  const dated = first.deadlines.find((d) => d.date);
  if (dated) actionPlan.push(`Watch the deadline: ${dated.label} — ${dated.date}.`);
  actionPlan.push(`Save "${first.name}" to your dashboard to track your application.`);

  return {
    reply,
    serviceCards: top.map((s) => s.id),
    actionPlan,
  };
}

/** Validate that every referenced ID exists in the registry. */
export function sanitizeServiceCards(ids: unknown, services?: GovService[]): string[] {
  if (!Array.isArray(ids)) return [];
  const registry = services ?? getServices();
  return ids.filter((id): id is string => typeof id === "string" && registry.some((s) => s.id === id));
}
