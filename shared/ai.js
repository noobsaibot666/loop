const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

const aiSystemPrompt = [
  "You write Alleycat city content for a cycling app.",
  "Keep language young, sharp, and readable.",
  "Do not sound corporate, cringe, or overhyped.",
  "Lean toward street culture, messenger energy, adolescent chaos, dares, and friend-group humor.",
  "Keep it respectful, funny, and a little shameless, but not abusive.",
  "Tasks must be physically doable in live city riding conditions.",
  "Avoid illegal, unsafe, or reckless instructions.",
  "Avoid tourist-attraction rounds, postcard landmarks, and generic city-center clichés.",
  "Prefer district spread, local texture, and route-choice pressure.",
  "Output only JSON that matches the schema.",
].join(" ");

const checkpointDraftSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    task_local: { type: "string" },
    task_fast: { type: "string" },
    task_chaotic: { type: "string" },
    admin_notes: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["task_local", "task_fast", "task_chaotic", "admin_notes"],
};

const packDraftSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    route_note: { type: "string" },
    finish_label: { type: "string" },
    spread_suggestions: {
      type: "array",
      items: { type: "string" },
    },
    tourist_overuse_warnings: {
      type: "array",
      items: { type: "string" },
    },
    admin_notes: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["route_note", "finish_label", "spread_suggestions", "tourist_overuse_warnings", "admin_notes"],
};

const extractOutputText = (data) => {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text;
  const parts = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) parts.push(content.text);
    }
  }
  return parts.join("").trim();
};

const callOpenAIJson = async ({ apiKey, model = DEFAULT_OPENAI_MODEL, schemaName, schema, userPrompt }) => {
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: aiSystemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "OpenAI request failed");
  }

  const text = extractOutputText(data);
  if (!text) throw new Error("OpenAI returned no draft content");
  return JSON.parse(text);
};

const buildCheckpointDraftPrompt = ({
  city,
  district,
  category,
  vibe,
  checkpoint_name,
  hint,
}) => `
Create three Alleycat checkpoint task variants for this spot.

City: ${city || "Unknown"}
District: ${district || "Unknown"}
Category: ${category || "Unknown"}
Vibe: ${vibe || "Unknown"}
Checkpoint name: ${checkpoint_name || "Unknown"}
Hint: ${hint || "Unknown"}

Rules:
- Each task should be one sentence.
- "local" should feel observant and rooted.
- "fast" should feel quick and dispatch-driven.
- "chaotic" should feel playful, mischievous, and pressure-heavy, but still safe and doable.
- Favor street-culture details, low-status dares, friend-group jokes, small embarrassing acts, tiny rituals, or pop references that fit the spot.
- Avoid tourist clichés, monument worship, and generic sightseeing behavior.
- Do not instruct social posting, trespassing, harassment, vandalism, or dangerous riding.
- Include short admin review notes about tone, safety, or overuse risk.
`.trim();

const buildPackDraftPrompt = ({ city, route_note, finish_label, checkpoints }) => `
Create Alleycat pack copy suggestions and route-spread guidance.

City: ${city || "Unknown"}
Current route note: ${route_note || "None"}
Current finish label: ${finish_label || "None"}
Checkpoint sample:
${(checkpoints || [])
  .slice(0, 12)
  .map((item) => `- ${item.name} | district: ${item.district || "unknown"} | category: ${item.category || "unknown"} | vibe: ${item.vibe || "unknown"}`)
  .join("\n")}

Rules:
- Keep route note and finish label concise.
- Keep language young, direct, and sharp, not try-hard.
- Push spread across districts instead of overusing obvious center-city icons.
- Treat this like a real alleycat tone, not a tourism guide or lifestyle brand.
- Favor backstreets, local friction, youth culture, odd corners, and places riders would laugh about after.
- Return specific spread suggestions and tourist-overuse warnings.
- Include short admin review notes.
`.trim();

export {
  DEFAULT_OPENAI_MODEL,
  buildCheckpointDraftPrompt,
  buildPackDraftPrompt,
  callOpenAIJson,
  checkpointDraftSchema,
  packDraftSchema,
};
