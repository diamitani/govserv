// ── GovServ shared types ──────────────────────────────────────────────
// Mirrors the schema of /data/services.json. The research seed pass will
// replace data/services.json with 45–60 verified entries; all code must
// treat the data generically (no hard-coded service IDs in UI logic).

export type ServiceLevel = "city" | "county" | "state" | "federal";

export type ContactKind = "phone" | "web" | "email" | "in-person";

export interface ServiceDeadline {
  label: string;
  /** ISO date (YYYY-MM-DD) or null for rolling/no fixed deadline */
  date: string | null;
  note?: string;
}

export interface ServiceContact {
  kind: ContactKind;
  label: string;
  value: string;
}

export interface ServiceApplyLink {
  label: string;
  url: string;
}

export interface GovService {
  id: string;
  name: string;
  agency: string;
  category: string;
  description: string;
  scope: {
    level: ServiceLevel;
    city?: string;
    county?: string;
    state?: string;
  };
  eligibility: string[];
  deadlines: ServiceDeadline[];
  prerequisites: string[];
  whatToBring: string[];
  contacts: ServiceContact[];
  applyLinks: ServiceApplyLink[];
  languages: string[];
  cost: string;
  /** ISO date the entry was last verified by the KB loop */
  verifiedAt: string;
  sources: string[];
}

// ── Dashboard state (localStorage `govserv:v1`) ────────────────────────

export type ApplicationStatus =
  | "to-start"
  | "gathering-docs"
  | "submitted"
  | "waiting"
  | "approved"
  | "denied";

export interface TrackedApplication {
  id: string;
  serviceId: string;
  status: ApplicationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomDeadline {
  id: string;
  label: string;
  date: string; // ISO YYYY-MM-DD
  note?: string;
  serviceId?: string;
}

export interface SavedService {
  id: string;
  serviceId: string;
  savedAt: string;
}

/** Per-application checklist state: serviceId -> item index -> done */
export type TaskState = Record<string, Record<number, boolean>>;

export interface DashboardState {
  applications: TrackedApplication[];
  customDeadlines: CustomDeadline[];
  saved: SavedService[];
  tasks: TaskState;
}

// ── Chat types ────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  serviceCards?: string[];
  actionPlan?: string[];
  createdAt: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatApiRequest {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  threadId?: string;
}

export interface ChatApiResponse {
  reply: string;
  serviceCards?: string[];
  actionPlan?: string[];
}
