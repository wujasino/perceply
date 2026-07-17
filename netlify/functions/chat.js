import { createClient } from '@supabase/supabase-js';
import ws from "ws";

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS_PER_WINDOW = Number(process.env.MAX_REQUESTS_PER_WINDOW || 15);
const MAX_REQUESTS_PER_DAY = Number(process.env.MAX_REQUESTS_PER_DAY || 300);
const EXTERNAL_TIMEOUT_MS = 25_000;
const MAX_TOOL_ITERATIONS = 6;

// In-memory store: secondary defense only — primary rate limiting is per user ID (verified via JWT)
const requestStore = new Map();
const now = () => Date.now();

const shouldRateLimit = (key) => {
  const current = now();
  const entry = requestStore.get(key) || {
    count: 0, windowStart: current, dailyCount: 0,
    dailyReset: current + 24 * 60 * 60 * 1000, lastRequest: current
  };
  if (current > entry.dailyReset) {
    entry.dailyCount = 0; entry.dailyReset = current + 24 * 60 * 60 * 1000;
    entry.windowStart = current; entry.count = 0;
  }
  if (current - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.windowStart = current; entry.count = 0;
  }
  entry.count += 1; entry.dailyCount += 1; entry.lastRequest = current;
  requestStore.set(key, entry);
  return entry.count > MAX_REQUESTS_PER_WINDOW || entry.dailyCount > MAX_REQUESTS_PER_DAY;
};

const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { params: { eventsPerSecond: 0 } },
  });
};

const fetchWithTimeout = (url, options) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

/* ── Config helpers (all scoped to the verified user id) ─────────────── */

const KNOWN_MODELS = ['gpt-4o', 'claude', 'gemini', 'perplexity', 'mistral', 'llama'];
const clampStr = (s, n = 120) => String(s ?? '').trim().slice(0, n);

const loadConfig = async (admin, userId) => {
  const { data } = await admin
    .from('brand_monitors')
    .select('brand, competitors, frequency, models, alert_metric, alert_threshold, enabled')
    .eq('user_id', userId)
    .maybeSingle();
  return data || {
    brand: null, competitors: [], frequency: 'weekly',
    models: ['gpt-4o', 'claude', 'gemini'], alert_metric: null,
    alert_threshold: null, enabled: true,
  };
};

const saveConfig = async (admin, userId, patch) => {
  const current = await loadConfig(admin, userId);
  const next = { ...current, ...patch };
  const { data, error } = await admin
    .from('brand_monitors')
    .upsert({ user_id: userId, ...next }, { onConflict: 'user_id' })
    .select('brand, competitors, frequency, models, alert_metric, alert_threshold, enabled')
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/* ── Tool definitions exposed to Claude ──────────────────────────────── */

const TOOLS = [
  {
    name: 'get_config',
    description: 'Read the user\'s current brand monitoring configuration. Call this first if you are unsure of the current state.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'set_brand',
    description: 'Set the primary brand the user wants to monitor in AI models.',
    input_schema: {
      type: 'object',
      properties: { brand: { type: 'string', description: 'Brand name or website, e.g. "Nike" or "acme.com".' } },
      required: ['brand'],
    },
  },
  {
    name: 'add_competitor',
    description: 'Add a competitor brand to track side-by-side with the primary brand.',
    input_schema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'remove_competitor',
    description: 'Remove a competitor from tracking.',
    input_schema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'set_schedule',
    description: 'Set how often the automated monitoring scan runs.',
    input_schema: {
      type: 'object',
      properties: { frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] } },
      required: ['frequency'],
    },
  },
  {
    name: 'set_alert',
    description: 'Set an alert that notifies the user when a metric drops below a threshold. Pass metric=null to clear the alert.',
    input_schema: {
      type: 'object',
      properties: {
        metric: { type: ['string', 'null'], enum: ['sentiment', 'visibility', 'mentions', null] },
        threshold: { type: 'number', description: '0-100. The alert fires when the metric falls below this.' },
      },
      required: ['metric'],
    },
  },
  {
    name: 'select_models',
    description: 'Choose which AI models the monitoring queries. Valid: gpt-4o, claude, gemini, perplexity, mistral, llama.',
    input_schema: {
      type: 'object',
      properties: { models: { type: 'array', items: { type: 'string' } } },
      required: ['models'],
    },
  },
];

/* ── Tool execution — every write is scoped to the verified user ─────── */

const runTool = async (admin, userId, name, input) => {
  switch (name) {
    case 'get_config':
      return await loadConfig(admin, userId);

    case 'set_brand':
      return await saveConfig(admin, userId, { brand: clampStr(input.brand) });

    case 'add_competitor': {
      const cfg = await loadConfig(admin, userId);
      const name2 = clampStr(input.name);
      if (!name2) return { error: 'Empty competitor name.' };
      const set = new Set([...(cfg.competitors || []), name2]);
      return await saveConfig(admin, userId, { competitors: [...set].slice(0, 10) });
    }

    case 'remove_competitor': {
      const cfg = await loadConfig(admin, userId);
      const target = clampStr(input.name).toLowerCase();
      return await saveConfig(admin, userId, {
        competitors: (cfg.competitors || []).filter(c => c.toLowerCase() !== target),
      });
    }

    case 'set_schedule':
      return await saveConfig(admin, userId, {
        frequency: ['daily', 'weekly', 'monthly'].includes(input.frequency) ? input.frequency : 'weekly',
      });

    case 'set_alert': {
      const metric = input.metric === null ? null : clampStr(input.metric);
      const valid = metric === null || ['sentiment', 'visibility', 'mentions'].includes(metric);
      if (!valid) return { error: 'Unknown metric.' };
      let threshold = metric === null ? null : Math.max(0, Math.min(100, Math.round(Number(input.threshold ?? 60))));
      return await saveConfig(admin, userId, { alert_metric: metric, alert_threshold: threshold });
    }

    case 'select_models': {
      const models = (Array.isArray(input.models) ? input.models : [])
        .map(m => clampStr(m).toLowerCase())
        .filter(m => KNOWN_MODELS.includes(m));
      if (!models.length) return { error: 'No valid models. Valid: ' + KNOWN_MODELS.join(', ') };
      return await saveConfig(admin, userId, { models: [...new Set(models)] });
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
};

const SYSTEM_PROMPT = `You are Perceply's setup assistant. You help brand owners and marketers configure their AI-visibility monitoring entirely through chat — no forms.

You can set the primary brand, add/remove competitors, set the scan schedule (daily/weekly/monthly), choose which AI models to query, and set a drop alert on a metric (sentiment/visibility/mentions).

Guidelines:
- Be warm, concise and plain-spoken. These are marketers, not engineers.
- When the user asks for several things at once, make all the needed tool calls.
- After changing configuration, briefly confirm in one or two sentences exactly what you set, and suggest a sensible next step.
- If a request is ambiguous (e.g. an alert without a threshold), pick a sensible default (threshold 60) and say what you chose so they can adjust.
- Never invent competitors or brands the user did not mention.
- You only configure monitoring. You do not run scans, change billing, or promise features that don't exist.`;

/* ── Anthropic tool-use loop ─────────────────────────────────────────── */

const callAnthropic = (messages) => fetchWithTimeout('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages,
  }),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  if (event.body && event.body.length > 32 * 1024) {
    return { statusCode: 413, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Payload too large' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.toString().replace(/^Bearer\s+/i, '');
  if (!token) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let authedUser = null;
  let admin = null;
  try {
    admin = createAdminClient();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    authedUser = user;
    if (shouldRateLimit(`user:${user.id}`)) {
      return { statusCode: 429, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Too many requests. Please try again in a moment.' }) };
    }
  } catch {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Authentication failed. Please try again.' }) };
  }

  // Graceful degradation when the model key is not configured.
  if (!process.env.ANTHROPIC_API_KEY) {
    const config = await loadConfig(admin, authedUser.id).catch(() => null);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reply: "The chat assistant isn't fully connected yet (missing model key), but your monitoring settings are safe. You can still configure everything from the dashboard.",
        config,
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    // Normalize client history into Anthropic message format (string content).
    const messages = incoming
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
      .slice(-16)
      .map(m => ({ role: m.role, content: clampStr(m.text, 4000) }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'A user message is required.' }) };
    }

    let finalText = '';
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const res = await callAnthropic(messages);
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.warn('Anthropic error', res.status, errBody.slice(0, 200));
        throw new Error('Model request failed');
      }
      const data = await res.json();
      const content = Array.isArray(data.content) ? data.content : [];

      // Collect any assistant text in this turn.
      finalText = content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || finalText;

      if (data.stop_reason !== 'tool_use') break;

      // Execute each requested tool and feed results back.
      messages.push({ role: 'assistant', content });
      const toolResults = [];
      for (const block of content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try {
          result = await runTool(admin, authedUser.id, block.name, block.input || {});
        } catch (err) {
          result = { error: String(err.message || 'tool failed').slice(0, 200) };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    const config = await loadConfig(admin, authedUser.id).catch(() => null);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: finalText || 'Done.', config }),
    };
  } catch (error) {
    console.error('chat handler error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'The assistant hit a snag. Please try again.' }),
    };
  }
};
