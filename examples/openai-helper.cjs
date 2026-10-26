'use strict';

// Server-side example only. Never send OPENAI_API_KEY to a browser.
function extractResponseText(data) {
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  const parts = (Array.isArray(data?.output) ? data.output : [])
    .flatMap(item => Array.isArray(item?.content) ? item.content : [])
    .filter(part => part?.type === 'output_text' && typeof part.text === 'string')
    .map(part => part.text.trim())
    .filter(Boolean);
  return parts.join('\n').trim();
}

async function runHelper(request, options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required on the server');
  if (!request) return '';

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || process.env.CONTEXT_HELPER_MODEL || request.model || 'gpt-6-luna',
      input: request.input,
      max_output_tokens: request.max_output_tokens
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI helper failed (${response.status})`);
  return extractResponseText(data);
}

module.exports = { extractResponseText, runHelper };

