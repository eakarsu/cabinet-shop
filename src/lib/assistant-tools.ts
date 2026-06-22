/**
 * Tool definitions and executors for the cabinet-shop AI concierge.
 * Mirrors the restaurant app: tools are "read" (run immediately) or "write"
 * (return a pendingAction that the guest must confirm before commit).
 *
 * Writes are committed by calling the site's own REST API routes, so the AI
 * goes through the exact same validation as the website forms.
 */
import { prisma } from "@/lib/db";
import { runOptimizer, type Engine, type PartInput } from "@/lib/cut-optimizer";

export type ToolKind = "read" | "write";

export interface ToolDef {
  kind: ToolKind;
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export function toOpenRouterTools(defs: ToolDef[]) {
  return defs.map((d) => ({ type: "function" as const, function: d.function }));
}

// Slots the showroom offers for consultations each working day.
export const DAILY_SLOTS = ["09:00", "10:30", "13:00", "14:30", "16:00"];

// ---------------------------------------------------------------------------
// Endpoint registry — every site API the assistant can drive automatically.
// ---------------------------------------------------------------------------
export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  kind: ToolKind;
  summary: string;
  params?: string;
}

export const ENDPOINTS: ApiEndpoint[] = [
  // ---- reads ----
  { id: "materials.list", method: "GET", path: "/api/materials", kind: "read", summary: "List materials & finishes", params: "query: category(Granite|Quartz|Marble|Cabinetry), search" },
  { id: "projects.list", method: "GET", path: "/api/projects", kind: "read", summary: "List completed gallery projects", params: "query: tag" },
  { id: "services.list", method: "GET", path: "/api/services", kind: "read", summary: "List services offered" },
  { id: "testimonials.list", method: "GET", path: "/api/testimonials", kind: "read", summary: "List customer reviews" },
  { id: "faqs.list", method: "GET", path: "/api/faqs", kind: "read", summary: "List FAQs", params: "query: search" },
  { id: "team.list", method: "GET", path: "/api/team", kind: "read", summary: "List team members" },
  { id: "quotes.list", method: "GET", path: "/api/quotes", kind: "read", summary: "List estimate/quote requests", params: "query: status" },
  { id: "consultations.list", method: "GET", path: "/api/consultations", kind: "read", summary: "List booked consultations", params: "query: date(YYYY-MM-DD), status" },
  { id: "settings.get", method: "GET", path: "/api/settings", kind: "read", summary: "Get company settings (name, phone, email, address, hours)" },

  // ---- writes (require confirmation) ----
  { id: "quote.create", method: "POST", path: "/api/quotes", kind: "write", summary: "Submit an estimate/quote request", params: "body: name, email, phone, projectType, material, zip, message" },
  { id: "quote.update", method: "PUT", path: "/api/quotes/:id", kind: "write", summary: "Update an estimate (e.g. status)", params: "path: id; body: status, projectType, material, message" },
  { id: "consultation.create", method: "POST", path: "/api/consultations", kind: "write", summary: "Book a design consultation", params: "body: name, phone, email, date(YYYY-MM-DD), time(HH:MM), projectType, material, address, notes" },
  { id: "consultation.update", method: "PUT", path: "/api/consultations/:id", kind: "write", summary: "Update/reschedule a consultation", params: "path: id; body: status, date, time, notes" },
  { id: "consultation.cancel", method: "DELETE", path: "/api/consultations/:id", kind: "write", summary: "Cancel a consultation", params: "path: id" },

  // ---- content management (admin) ----
  { id: "material.create", method: "POST", path: "/api/materials", kind: "write", summary: "Add a material", params: "body: name, category(Granite|Quartz|Marble|Cabinetry), kind, blurb, origin, priceTier($|$$|$$$), features(comma list), swatch, featured(bool)" },
  { id: "material.update", method: "PUT", path: "/api/materials/:id", kind: "write", summary: "Edit a material", params: "path: id; body: any material fields" },
  { id: "material.delete", method: "DELETE", path: "/api/materials/:id", kind: "write", summary: "Delete a material", params: "path: id" },
  { id: "project.create", method: "POST", path: "/api/projects", kind: "write", summary: "Add a gallery project", params: "body: title, tag, location, description, year, featured(bool), grad" },
  { id: "project.update", method: "PUT", path: "/api/projects/:id", kind: "write", summary: "Edit a gallery project", params: "path: id; body: any project fields" },
  { id: "project.delete", method: "DELETE", path: "/api/projects/:id", kind: "write", summary: "Delete a gallery project", params: "path: id" },
  { id: "service.create", method: "POST", path: "/api/services", kind: "write", summary: "Add a service", params: "body: title, description, icon" },
  { id: "service.update", method: "PUT", path: "/api/services/:id", kind: "write", summary: "Edit a service", params: "path: id; body: title, description, icon" },
  { id: "service.delete", method: "DELETE", path: "/api/services/:id", kind: "write", summary: "Delete a service", params: "path: id" },
  { id: "testimonial.create", method: "POST", path: "/api/testimonials", kind: "write", summary: "Add a review", params: "body: quote, name, detail, rating(1-5)" },
  { id: "testimonial.update", method: "PUT", path: "/api/testimonials/:id", kind: "write", summary: "Edit a review", params: "path: id; body: quote, name, detail, rating" },
  { id: "testimonial.delete", method: "DELETE", path: "/api/testimonials/:id", kind: "write", summary: "Delete a review", params: "path: id" },
  { id: "team.create", method: "POST", path: "/api/team", kind: "write", summary: "Add a team member", params: "body: name, role, bio, initials" },
  { id: "team.update", method: "PUT", path: "/api/team/:id", kind: "write", summary: "Edit a team member", params: "path: id; body: name, role, bio, initials" },
  { id: "team.delete", method: "DELETE", path: "/api/team/:id", kind: "write", summary: "Delete a team member", params: "path: id" },
  { id: "faq.create", method: "POST", path: "/api/faqs", kind: "write", summary: "Add an FAQ", params: "body: question, answer" },
  { id: "faq.update", method: "PUT", path: "/api/faqs/:id", kind: "write", summary: "Edit an FAQ", params: "path: id; body: question, answer" },
  { id: "faq.delete", method: "DELETE", path: "/api/faqs/:id", kind: "write", summary: "Delete an FAQ", params: "path: id" },
  { id: "settings.update", method: "PUT", path: "/api/settings", kind: "write", summary: "Update company settings", params: "body: companyName, phone, email, address, hours(array)" },
];

const ENDPOINTS_BY_ID = new Map(ENDPOINTS.map((e) => [e.id, e]));
export function findEndpoint(id: string): ApiEndpoint | undefined {
  return ENDPOINTS_BY_ID.get(id);
}
const READ_IDS = ENDPOINTS.filter((e) => e.kind === "read").map((e) => e.id);
const WRITE_IDS = ENDPOINTS.filter((e) => e.kind === "write").map((e) => e.id);

export function endpointCatalog(): string {
  return ENDPOINTS.map(
    (e) => `- ${e.id} (${e.kind}): ${e.summary}${e.params ? ` [${e.params}]` : ""}`
  ).join("\n");
}

function resolvePath(path: string, pathParams: Record<string, unknown> = {}): string {
  return path.replace(/:([A-Za-z]+)/g, (_, key) => {
    const v = pathParams[key];
    if (v == null || v === "") throw new Error(`Missing path parameter "${key}".`);
    return encodeURIComponent(String(v));
  });
}

export const ASSISTANT_TOOLS: ToolDef[] = [
  {
    kind: "read",
    function: {
      name: "search_materials",
      description:
        "Search countertop and cabinetry materials by category (Granite, Quartz, Marble, Cabinetry) or keyword. Use to answer questions about colors, prices, and finishes.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Optional: Granite, Quartz, Marble, or Cabinetry." },
          search: { type: "string", description: "Optional keyword, e.g. 'white', 'calacatta'." },
        },
      },
    },
  },
  {
    kind: "read",
    function: {
      name: "list_projects",
      description:
        "List completed gallery projects, optionally filtered by material tag (Granite, Quartz, Marble, Cabinetry).",
      parameters: {
        type: "object",
        properties: {
          tag: { type: "string", description: "Optional material tag to filter by." },
        },
      },
    },
  },
  {
    kind: "read",
    function: {
      name: "check_consultation_availability",
      description:
        "Check which consultation time slots are still open on a given date. Use before offering a booking time.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format." },
        },
        required: ["date"],
      },
    },
  },
  {
    kind: "write",
    function: {
      name: "book_consultation",
      description:
        "Book a free design consultation. Collect name, phone, date and time first. Requires user confirmation before it is saved.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD" },
          time: { type: "string", description: "24h HH:MM, e.g. 14:30" },
          projectType: { type: "string", description: "e.g. Kitchen countertops, Custom cabinetry" },
          material: { type: "string", description: "e.g. Granite, Quartz" },
          address: { type: "string" },
          notes: { type: "string" },
        },
        required: ["name", "phone", "date", "time"],
      },
    },
  },
  {
    kind: "write",
    function: {
      name: "submit_quote",
      description:
        "Submit a free-estimate / quote request lead. Collect name, email, and phone first. Requires user confirmation before it is saved.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          projectType: { type: "string" },
          material: { type: "string" },
          zip: { type: "string" },
          message: { type: "string" },
        },
        required: ["name", "email", "phone"],
      },
    },
  },
  {
    kind: "read",
    function: {
      name: "optimize_cut",
      description:
        "Run the stone cut optimizer for a job: nest countertop parts onto slabs and return how many slabs are needed, the yield %, waste, and material cost. Infer the parts from what the user describes (e.g. 'a 96x36 island and two 98x26 counters'). Optionally name a material to use its real slab size and cost.",
      parameters: {
        type: "object",
        properties: {
          material: { type: "string", description: "Optional material name (e.g. 'Black Pearl Granite') to use its slab size + cost." },
          slabWidth: { type: "number", description: "Slab width in inches (default 126 or the material's)." },
          slabHeight: { type: "number", description: "Slab height in inches (default 63 or the material's)." },
          kerf: { type: "number", description: "Blade width in inches (default 0.125)." },
          engine: { type: "string", enum: ["shelf", "maxrects", "freeform"], description: "Packing engine (default maxrects)." },
          allowRotate: { type: "boolean", description: "Allow rotating parts (default true)." },
          useRemnants: { type: "boolean", description: "Use saved remnants of the material as free stock first (default false)." },
          parts: {
            type: "array",
            description: "Parts to cut.",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                w: { type: "number", description: "width in inches" },
                h: { type: "number", description: "height in inches" },
                qty: { type: "integer" },
              },
              required: ["w", "h", "qty"],
            },
          },
        },
        required: ["parts"],
      },
    },
  },
  {
    kind: "read",
    function: {
      name: "query_data",
      description:
        "Look up any site data by choosing a read endpoint id from the catalog in the system prompt — services, testimonials, FAQs, team, quotes, consultations, etc.",
      parameters: {
        type: "object",
        properties: {
          endpoint: { type: "string", enum: READ_IDS, description: "Read endpoint id from the catalog." },
          pathParams: { type: "object", description: 'Values for :id style segments, e.g. { id: "abc" }.' },
          query: { type: "object", description: 'Optional query filters, e.g. { date: "2026-06-25" }.' },
        },
        required: ["endpoint"],
      },
    },
  },
  {
    kind: "write",
    function: {
      name: "perform_action",
      description:
        "Create, update, or cancel data by choosing a write endpoint id from the catalog — e.g. reschedule or cancel a consultation. Requires user confirmation before it runs.",
      parameters: {
        type: "object",
        properties: {
          endpoint: { type: "string", enum: WRITE_IDS, description: "Write endpoint id from the catalog." },
          pathParams: { type: "object", description: 'Values for :id style segments, e.g. { id: "abc" }.' },
          body: { type: "object", description: "Request body fields per the catalog hint." },
        },
        required: ["endpoint"],
      },
    },
  },
];

export const TOOL_KIND: Record<string, ToolKind> = Object.fromEntries(
  ASSISTANT_TOOLS.map((t) => [t.function.name, t.kind])
);

// ---------------------------------------------------------------------------
// Read executors
// ---------------------------------------------------------------------------
export async function runReadTool(name: string, args: any): Promise<unknown> {
  switch (name) {
    case "query_data": {
      const ep = findEndpoint(args?.endpoint);
      if (!ep || ep.kind !== "read")
        throw new Error(`Unknown data endpoint "${args?.endpoint}".`);
      let path = resolvePath(ep.path, args?.pathParams || {});
      if (args?.query && typeof args.query === "object") {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(args.query)) {
          if (v != null && v !== "") qs.append(k, String(v));
        }
        const s = qs.toString();
        if (s) path += `?${s}`;
      }
      return truncateResult(await requestApi("GET", path));
    }
    case "search_materials": {
      const materials = await prisma.material.findMany({
        where: {
          ...(args?.category
            ? { category: { equals: String(args.category), mode: "insensitive" } }
            : {}),
          ...(args?.search
            ? {
                OR: [
                  { name: { contains: String(args.search), mode: "insensitive" } },
                  { blurb: { contains: String(args.search), mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ featured: "desc" }, { order: "asc" }],
        take: 25,
      });
      return {
        count: materials.length,
        materials: materials.map((m) => ({
          name: m.name,
          category: m.category,
          kind: m.kind,
          priceTier: m.priceTier,
          origin: m.origin,
          features: m.features,
          blurb: m.blurb,
        })),
      };
    }
    case "list_projects": {
      const projects = await prisma.project.findMany({
        where:
          args?.tag && args.tag !== "All"
            ? { tag: { equals: String(args.tag), mode: "insensitive" } }
            : {},
        orderBy: [{ featured: "desc" }, { order: "asc" }],
        take: 25,
      });
      return {
        count: projects.length,
        projects: projects.map((p) => ({
          title: p.title,
          tag: p.tag,
          location: p.location,
          year: p.year,
          description: p.description,
        })),
      };
    }
    case "optimize_cut": {
      const partsIn: PartInput[] = Array.isArray(args?.parts)
        ? args.parts.map((p: any) => ({
            label: String(p.label || "Part"),
            w: Number(p.w) || 0,
            h: Number(p.h) || 0,
            qty: Math.max(1, Number(p.qty) || 1),
          }))
        : [];
      if (partsIn.length === 0) throw new Error("No parts were provided to optimize.");

      let mat: any = null;
      if (args?.material) {
        mat = await prisma.material.findFirst({
          where: { name: { contains: String(args.material), mode: "insensitive" } },
        });
      }
      const slabW = Number(args?.slabWidth) || mat?.slabWidth || 126;
      const slabH = Number(args?.slabHeight) || mat?.slabHeight || 63;
      const slabCost = args?.slabCost != null ? Number(args.slabCost) : mat?.slabCost ?? null;
      const kerf = args?.kerf != null ? Number(args.kerf) : 0.125;
      const engine: Engine = ["shelf", "maxrects", "freeform"].includes(args?.engine)
        ? args.engine
        : "maxrects";
      const allowRotate = args?.allowRotate !== false;

      let remnants: { w: number; h: number; id: string }[] = [];
      if (args?.useRemnants && mat) {
        const rs = await prisma.remnant.findMany({ where: { materialId: mat.id, used: false } });
        remnants = rs.map((r) => ({ w: r.w, h: r.h, id: r.id }));
      }

      const r = runOptimizer({
        slabW, slabH, kerf, parts: partsIn, allowRotate, engine,
        remnants, slabCost: slabCost ?? undefined,
      });
      return {
        material: mat?.name ?? null,
        slab: `${slabW}x${slabH}`,
        engine,
        slabsNeeded: r.slabsUsed,
        remnantsUsed: r.remnantsUsed,
        yieldPct: Number(r.yieldPct.toFixed(1)),
        wasteSqFt: Number((r.wasteArea / 144).toFixed(1)),
        materialCost: r.cost,
        partsPlaced: r.placedCount,
        unplaced: r.unplaced,
      };
    }
    case "check_consultation_availability": {
      const start = new Date(args.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(args.date);
      end.setHours(23, 59, 59, 999);
      const booked = await prisma.consultation.findMany({
        where: { date: { gte: start, lte: end }, status: { not: "cancelled" } },
        select: { time: true },
      });
      const taken = new Set(booked.map((b) => b.time));
      const open = DAILY_SLOTS.filter((s) => !taken.has(s));
      return { date: args.date, openSlots: open, bookedSlots: [...taken] };
    }
    default:
      throw new Error(`Unknown read tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Write tools — preview + commit
// ---------------------------------------------------------------------------
export interface WritePreview {
  summary: string;
  normalized: any;
}

export async function previewWrite(name: string, args: any): Promise<WritePreview> {
  switch (name) {
    case "perform_action": {
      const ep = findEndpoint(args?.endpoint);
      if (!ep || ep.kind !== "write")
        throw new Error(`Unknown action endpoint "${args?.endpoint}".`);
      const path = resolvePath(ep.path, args?.pathParams || {});
      const detail =
        args?.body && Object.keys(args.body).length > 0
          ? ` — ${JSON.stringify(args.body)}`
          : args?.pathParams && Object.keys(args.pathParams).length > 0
            ? ` (${JSON.stringify(args.pathParams)})`
            : "";
      return {
        summary: `${ep.summary}${detail}`,
        normalized: { method: ep.method, path, body: args?.body },
      };
    }
    case "book_consultation": {
      if (!args.name || !args.phone)
        throw new Error("A name and phone number are required.");
      if (!args.date || !args.time)
        throw new Error("A date and time are required.");
      const d = new Date(`${args.date}T${String(args.time).padStart(5, "0")}:00`);
      if (isNaN(d.getTime())) throw new Error("Invalid date or time.");
      const normalized = {
        name: String(args.name),
        phone: String(args.phone),
        email: args.email ? String(args.email) : null,
        date: args.date,
        time: String(args.time),
        projectType: args.projectType || null,
        material: args.material || null,
        address: args.address || null,
        notes: args.notes || null,
      };
      const when = d.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const summary =
        `Book a design consultation for ${normalized.name} on ${when}` +
        (normalized.projectType ? ` about ${normalized.projectType}` : "") +
        `. Phone: ${normalized.phone}.`;
      return { summary, normalized };
    }
    case "submit_quote": {
      if (!args.name || !args.email || !args.phone)
        throw new Error("Name, email, and phone are required.");
      const normalized = {
        name: String(args.name),
        email: String(args.email),
        phone: String(args.phone),
        projectType: args.projectType || null,
        material: args.material || null,
        zip: args.zip || null,
        message: args.message || null,
      };
      const summary =
        `Submit a free-estimate request for ${normalized.name}` +
        (normalized.projectType ? ` (${normalized.projectType})` : "") +
        `. We'll contact ${normalized.email} / ${normalized.phone}.`;
      return { summary, normalized };
    }
    default:
      throw new Error(`Unknown write tool: ${name}`);
  }
}

function apiBase(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function requestApi(method: string, path: string, body?: unknown): Promise<any> {
  // The assistant runs server-side and is trusted; pass the internal token so
  // guarded write endpoints accept its calls.
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (process.env.NEXTAUTH_SECRET) headers["x-internal-token"] = process.env.NEXTAUTH_SECRET;
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `API ${path} returned ${res.status}`);
  return data;
}

function truncateResult(data: any): unknown {
  if (Array.isArray(data)) return { count: data.length, items: data.slice(0, 25) };
  if (data && Array.isArray(data.data))
    return { ...data, data: data.data.slice(0, 25), _truncated: data.data.length > 25 };
  return data;
}

export async function commitWrite(name: string, args: any): Promise<unknown> {
  const { normalized } = await previewWrite(name, args);
  switch (name) {
    case "perform_action":
      return await requestApi(normalized.method, normalized.path, normalized.body);
    case "book_consultation": {
      const c = await requestApi("POST", "/api/consultations", {
        ...normalized,
        source: "ai_assistant",
      });
      return { ok: true, consultationId: c.id, status: c.status, time: c.time };
    }
    case "submit_quote": {
      const q = await requestApi("POST", "/api/quotes", {
        ...normalized,
        source: "ai_assistant",
      });
      return { ok: true, quoteId: q.id, status: q.status };
    }
    default:
      throw new Error(`Unknown write tool: ${name}`);
  }
}
