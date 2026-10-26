'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractResponseText, runHelper } = require('../examples/openai-helper.cjs');

test('extracts text from the raw Responses API output structure', () => {
  const text = extractResponseText({
    output: [{ content: [{ type: 'output_text', text: 'Relevant recalled detail.' }] }]
  });
  assert.equal(text, 'Relevant recalled detail.');
});

test('helper uses a server key and returns structured output text', async () => {
  let request;
  const result = await runHelper(
    { model: 'test-helper', input: [], max_output_tokens: 50 },
    {
      apiKey: 'synthetic-test-key',
      fetchImpl: async (url, options) => {
        request = { url, options };
        return {
          ok: true,
          json: async () => ({
            output: [{ content: [{ type: 'output_text', text: 'Safe result.' }] }]
          })
        };
      }
    }
  );
  assert.equal(result, 'Safe result.');
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.options.headers.Authorization, 'Bearer synthetic-test-key');
});
