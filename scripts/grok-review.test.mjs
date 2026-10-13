import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { buildCreateRequest, main, parseArgs } from './grok-review.mjs';

const apiKey = 'MARKER-KEY-123';
const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
const authorization = `Basic ${encodedKey}`;
const promptText = 'Review the change.';
const patchText = 'diff --git a/a b/a\n';
const reply = 'The reply is preserved exactly.\nSecond line.\n';
const args = [
  '--model',
  'grok-4.7',
  '--prompt',
  'prompt.md',
  '--patch',
  'change.patch',
  '--out',
  'review.md',
  '--param',
  'reasoning_effort=high',
  '--param',
  'context=large',
];

function createResponse(status, body, headers) {
  return new globalThis.Response(body, { status, headers });
}

function successFetch() {
  return async (url, init = {}) => {
    if (url === 'https://api.cursor.com/v1/agents') {
      expect(init.method).toBe('POST');
      expect(new globalThis.Headers(init.headers).get('Authorization')).toBe(authorization);
      return createResponse(
        201,
        JSON.stringify({
          agent: { id: 'bc-1' },
          run: { id: 'run-1', status: 'RUNNING' },
        }),
      );
    }

    if (url === 'https://api.cursor.com/v1/agents/bc-1/runs/run-1/stream') {
      const headers = new globalThis.Headers(init.headers);
      expect(headers.get('Accept')).toBe('text/event-stream');
      expect(headers.get('Authorization')).toBe(authorization);
      return createResponse(
        200,
        [
          'event: interaction_update\ndata: {}',
          'event: thinking\ndata: {}',
          'event: assistant\ndata: {}',
          'event: status\ndata: {"runId":"run-1","status":"FINISHED"}',
          `event: result\ndata: ${JSON.stringify({ runId: 'run-1', status: 'FINISHED', text: reply, durationMs: 8827 })}`,
          'event: done\ndata: {}',
          '',
        ].join('\n\n'),
        { 'Content-Type': 'text/event-stream' },
      );
    }

    if (url === 'https://api.cursor.com/v1/agents/bc-1/runs/run-1') {
      expect(new globalThis.Headers(init.headers).get('Authorization')).toBe(authorization);
      return createResponse(
        200,
        JSON.stringify({
          id: 'run-1',
          agentId: 'bc-1',
          status: 'FINISHED',
          durationMs: 8827,
          result: reply,
        }),
      );
    }

    throw new Error(`Unexpected URL: ${url}`);
  };
}

function collectOutput() {
  const logEntries = [];
  const writes = [];

  return {
    logEntries,
    writes,
    log: (...values) => logEntries.push(values.join(' ')),
    writeFile: async (path, content) => writes.push([path, content]),
  };
}

function expectSecretAbsent(output) {
  const rendered = JSON.stringify(output);
  expect(rendered).not.toContain(apiKey);
  expect(rendered).not.toContain(encodedKey);
}

describe('reviewer CLI arguments and request', () => {
  test('requires a model and reports malformed parameters with usage', () => {
    expect(() =>
      parseArgs(['--prompt', 'prompt.md', '--patch', 'patch.diff', '--out', 'out.md']),
    ).toThrow(/usage/i);
    expect(() => parseArgs([...args, '--param', 'reasoning_effort'])).toThrow(/usage/i);
  });

  test('builds the Cursor create request from prompt, patch, model, and parameters', () => {
    const request = buildCreateRequest({
      model: 'grok-4.7',
      params: [
        { id: 'reasoning_effort', value: 'high' },
        { id: 'context', value: 'large' },
      ],
      promptText,
      patchText,
      apiKey,
    });
    const headers = new globalThis.Headers(request.init.headers);
    const body = JSON.parse(request.init.body);

    expect(request.url).toBe('https://api.cursor.com/v1/agents');
    expect(request.init.method).toBe('POST');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe(authorization);
    expect(body).toEqual({
      prompt: { text: `${promptText}\n\n\`\`\`diff\n${patchText}\n\`\`\`` },
      model: {
        id: 'grok-4.7',
        params: [
          { id: 'reasoning_effort', value: 'high' },
          { id: 'context', value: 'large' },
        ],
      },
    });
    expect(body).not.toHaveProperty('repos');
    expect(body).not.toHaveProperty('env');

    const withoutParams = buildCreateRequest({
      model: 'grok-4.7',
      params: [],
      promptText,
      patchText,
      apiKey,
    });
    expect(JSON.parse(withoutParams.init.body).model).not.toHaveProperty('params');
  });
});

describe('reviewer CLI main flow', () => {
  test('writes metadata and the reply verbatim after the separator without leaking the key', async () => {
    const output = collectOutput();
    const times = [1000, 11000];
    const code = await main(args, {
      env: { CURSOR_API_KEY: apiKey },
      fetch: successFetch(),
      readFile: async (path) => (path === 'prompt.md' ? promptText : patchText),
      writeFile: output.writeFile,
      log: output.log,
      now: () => times.shift(),
    });
    const [path, contents] = output.writes[0];
    const [metadata, savedReply] = contents.split(/\r?\n[-=]{3,}\r?\n/);

    expect(code).toBe(0);
    expect(path).toBe('review.md');
    expect(metadata).toContain('grok-4.7');
    expect(metadata).toContain('reasoning_effort');
    expect(metadata).toContain('high');
    expect(metadata).toContain('context');
    expect(metadata).toContain('large');
    expect(metadata).toContain('bc-1');
    expect(metadata).toContain('run-1');
    expect(metadata).toContain('FINISHED');
    expect(metadata).toMatch(/10(?:\.0+)?\s*(?:seconds|secs?|s)\b/i);
    expect(savedReply).toBe(reply);
    expectSecretAbsent(output);
  });

  test('returns non-zero and does not fetch when the required model is missing', async () => {
    const output = collectOutput();
    let fetchCalls = 0;
    const code = await main(
      ['--prompt', 'prompt.md', '--patch', 'change.patch', '--out', 'review.md'],
      {
        env: { CURSOR_API_KEY: apiKey },
        fetch: async () => {
          fetchCalls += 1;
          return createResponse(200, '{}');
        },
        readFile: async () => '',
        writeFile: output.writeFile,
        log: output.log,
        now: () => 0,
      },
    );

    expect(code).not.toBe(0);
    expect(fetchCalls).toBe(0);
    expect(output.logEntries.join(' ')).not.toBe('');
    expectSecretAbsent(output);
  });

  test('reports a missing Cursor key without calling fetch', async () => {
    const output = collectOutput();
    let fetchCalls = 0;
    const code = await main(args, {
      env: {},
      fetch: async () => {
        fetchCalls += 1;
        return createResponse(200, '{}');
      },
      readFile: async () => '',
      writeFile: output.writeFile,
      log: output.log,
      now: () => 0,
    });

    expect(code).not.toBe(0);
    expect(fetchCalls).toBe(0);
    expect(JSON.stringify(output)).toContain('CURSOR_API_KEY');
  });

  test('does not leak secrets when the create request fails with an echoed authorization header', async () => {
    const output = collectOutput();
    const code = await main(args, {
      env: { CURSOR_API_KEY: apiKey },
      fetch: async () => createResponse(401, `Rejected ${authorization}`),
      readFile: async (path) => (path === 'prompt.md' ? promptText : patchText),
      writeFile: output.writeFile,
      log: output.log,
      now: () => 0,
    });

    expect(code).not.toBe(0);
    expect(output.logEntries.join(' ')).not.toBe('');
    expect(output.logEntries.join(' ')).toContain('401');
    expectSecretAbsent(output);
  });

  test('does not leak secrets when fetch rejects with an echoed authorization header', async () => {
    const output = collectOutput();
    const code = await main(args, {
      env: { CURSOR_API_KEY: apiKey },
      fetch: async () => {
        throw new Error(`Request failed: ${authorization}`);
      },
      readFile: async (path) => (path === 'prompt.md' ? promptText : patchText),
      writeFile: output.writeFile,
      log: output.log,
      now: () => 0,
    });

    expect(code).not.toBe(0);
    expect(output.logEntries.join(' ')).not.toBe('');
    expect(output.logEntries.join(' ')).toContain('Request failed');
    expectSecretAbsent(output);
  });

  test('returns non-zero when the event stream ends without done', async () => {
    const output = collectOutput();
    let calls = 0;
    const code = await main(args, {
      env: { CURSOR_API_KEY: apiKey },
      fetch: async () => {
        calls += 1;
        if (calls === 1) {
          return createResponse(
            201,
            JSON.stringify({ agent: { id: 'bc-1' }, run: { id: 'run-1' } }),
          );
        }
        return createResponse(200, 'event: status\ndata: {}\n\n');
      },
      readFile: async (path) => (path === 'prompt.md' ? promptText : patchText),
      writeFile: output.writeFile,
      log: output.log,
      now: () => 0,
    });

    expect(code).not.toBe(0);
    expect(output.logEntries.join(' ')).not.toBe('');
    expectSecretAbsent(output);
  });

  test('returns non-zero when the run status after done is not FINISHED', async () => {
    const output = collectOutput();
    let calls = 0;
    const code = await main(args, {
      env: { CURSOR_API_KEY: apiKey },
      fetch: async () => {
        calls += 1;
        if (calls === 1) {
          return createResponse(
            201,
            JSON.stringify({ agent: { id: 'bc-1' }, run: { id: 'run-1' } }),
          );
        }
        if (calls === 2) {
          return createResponse(200, 'event: done\ndata: {}\n\n');
        }
        return createResponse(200, JSON.stringify({ id: 'run-1', status: 'FAILED' }));
      },
      readFile: async (path) => (path === 'prompt.md' ? promptText : patchText),
      writeFile: output.writeFile,
      log: output.log,
      now: () => 0,
    });

    expect(code).not.toBe(0);
    expect(output.logEntries.join(' ')).toContain('FAILED');
    expectSecretAbsent(output);
  });
});
