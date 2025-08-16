import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620';

function getAnthropicApiKey() {
  return process.env.ANTHROPIC_API_KEY || process.env.SOKOSUMI_API_KEY || null;
}

function buildClient() {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) return null;
  return new Anthropic({apiKey});
}

function buildPrompt(nlText) {
  return `You are a strict command router for a CLI application.
The CLI has these top-level sections (value in parentheses):
- My Account (account)
- Agents (agents)
- Jobs (jobs)
- Quit (quit)

Task: Map the user's request to exactly one section value from [account, agents, jobs, quit].
Also select a concise action verb and extract any relevant arguments.
If you are not confident, choose "unknown".

Guidelines:
- account: actions [show, usage, billing, plan, settings]
- agents: actions [list, show, create, update, delete]
- jobs: actions [list, start, status, cancel]
- quit: actions [quit]

Arguments (args) should be a flat JSON object with stable keys when present, e.g.:
- agents.create: {"agent_name":"..."}
- agents.show/update/delete: {"agent_id":"..."} OR {"agent_name":"..."}
- jobs.start: {"job_name":"..."} or {"task":"..."}
- jobs.status/cancel: {"job_id":"..."}
- account.show/usage/plan/billing/settings: {}

Respond with ONLY minified JSON, no markdown and no extra text. Schema:
{"section":"<account|agents|jobs|quit|unknown>","action":"<string>","args":{},"confidence":<0..1>,"reason":"<short>"}

User request: ${nlText}`;
}

export async function interpretUserRequest(nlText, options = {}) {
  const client = buildClient();
  if (!client) {
    return {section: 'unknown', confidence: 0, reason: 'Missing ANTHROPIC_API_KEY'};
  }

  const model = options.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const prompt = buildPrompt(nlText);
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 256,
      temperature: 0,
      messages: [
        {role: 'user', content: prompt}
      ]
    });

    let text = '';
    try {
      const first = response?.content?.[0];
      if (first && first.type === 'text') text = first.text || '';
      // Some SDK versions may return a string in content; fallback
      if (!text && typeof response?.content === 'string') text = response.content;
    } catch {}

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // try to extract JSON substring
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        const maybe = text.slice(start, end + 1);
        try { parsed = JSON.parse(maybe); } catch {}
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return {section: 'unknown', confidence: 0, reason: 'Unparseable response'};
    }

    const section = ['account', 'agents', 'jobs', 'quit', 'unknown'].includes(parsed.section)
      ? parsed.section
      : 'unknown';
    const action = typeof parsed.action === 'string' && parsed.action.trim() ? parsed.action.trim() : 'unknown';
    const args = parsed && typeof parsed.args === 'object' && !Array.isArray(parsed.args) ? parsed.args : {};
    const confidence = Number.isFinite(parsed.confidence) ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
    const reason = typeof parsed.reason === 'string' ? parsed.reason : '';
    return {section, action, args, confidence, reason};
  } catch (error) {
    return {section: 'unknown', action: 'unknown', args: {}, confidence: 0, reason: error?.message || 'Anthropic error'};
  }
}


