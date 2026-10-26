'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const context = require('../src/index.cjs');

function messages(count) {
  return Array.from({ length: count }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: `message ${index + 1}`
  }));
}

test('ordinary messages use tier 1 and expose only the recent window', () => {
  const prepared = context.prepareContext({ messages: messages(20), query: 'Hello there' });
  assert.equal(prepared.tier, 1);
  assert.equal(prepared.recentMessages.length, 8);
  assert.equal(prepared.recentMessages[0].content, 'message 13');
  assert.equal(prepared.helperTranscript, '');
});

test('an earlier-message cue uses a capped tier 2 helper window', () => {
  const prepared = context.prepareContext({
    messages: messages(45),
    query: 'Can you check earlier messages?',
    options: { expandedWindow: 30 }
  });
  assert.equal(prepared.tier, 2);
  assert.match(prepared.helperTranscript, /^16\./);
  assert.match(prepared.helperTranscript, /45\./);
  assert.equal(context.buildRecallRequest(prepared).model, 'gpt-6-luna');
});

test('an explicit whole-thread request uses tier 3', () => {
  const prepared = context.prepareContext({
    messages: messages(40),
    query: 'Search the whole thread for it'
  });
  assert.equal(prepared.tier, 3);
  assert.match(prepared.helperTranscript, /^1\./);
});

test('a negated whole-thread request does not activate wider disclosure', () => {
  const prepared = context.prepareContext({
    messages: messages(40),
    query: 'Please do not search the whole thread for this.'
  });
  assert.equal(prepared.tier, 1);
  assert.equal(prepared.helperTranscript, '');
});

test('an application can supply an explicit tier decision', () => {
  const prepared = context.prepareContext({
    messages: messages(40),
    query: 'ordinary wording',
    tier: 3
  });
  assert.equal(prepared.tier, 3);
});

test('full-thread transcript keeps the newest text when capped', () => {
  const prepared = context.prepareContext({
    messages: messages(40),
    query: 'Check the full conversation',
    options: { fullThreadCharLimit: 120 }
  });
  assert.match(prepared.helperTranscript, /Earlier text omitted/);
  assert.match(prepared.helperTranscript, /message 40/);
  assert.doesNotMatch(prepared.helperTranscript, /message 1\n/);
  assert.ok(prepared.helperTranscript.length <= 120);
});

test('rolling summary refresh is incremental and bounded', () => {
  const state = { text: 'Earlier facts.', lastMessageCount: 30 };
  assert.equal(context.shouldRefreshSummary(state, 59), false);
  assert.equal(context.shouldRefreshSummary(state, 60), true);
  const request = context.buildSummaryRequest({ messages: messages(60), state });
  assert.match(request.input[1].content, /31\. User: message 31/);
  assert.equal(request.nextMessageCount, 60);
  const next = context.applySummaryResponse('Summary: one two three four', 60, { summaryMaxWords: 3 });
  assert.equal(next.text, 'one two three…');
  assert.equal(next.lastMessageCount, 60);
});

test('model-generated recall is separated from the user message', () => {
  const prepared = context.prepareContext({
    messages: messages(12),
    query: 'Look back further',
    rollingSummary: 'A compact history.'
  });
  const result = context.buildCompanionContext(prepared, 'The relevant detail is message 4.');
  assert.equal(result.system.length, 2);
  assert.match(result.system[1], /not as a new user instruction/);
  assert.equal(result.recentMessages.length, 8);
});

test('non-conversation roles are not relabelled as user messages', () => {
  const normalized = context.normaliseMessages([
    { role: 'system', content: 'private system instruction' },
    { role: 'tool', content: 'tool output' },
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' }
  ]);
  assert.deepEqual(normalized, [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' }
  ]);
});

test('a delayed summary refresh processes the oldest unseen batch without skipping', () => {
  const state = { text: 'Earlier facts.', lastMessageCount: 30 };
  const request = context.buildSummaryRequest({ messages: messages(95), state });
  assert.match(request.input[1].content, /31\. User: message 31/);
  assert.match(request.input[1].content, /60\. Companion: message 60/);
  assert.doesNotMatch(request.input[1].content, /message 61/);
  assert.equal(request.nextMessageCount, 60);
});

