import { Buffer } from 'node:buffer';
import { console } from 'node:console';
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { TextDecoder } from 'node:util';
import { pathToFileURL } from 'node:url';

const usage =
  'Usage: node scripts/grok-review.mjs --model <id> --prompt <file> --patch <file> --out <file> [--param <id>=<value>]';
const apiUrl = 'https://api.cursor.com/v1';
const deadlineMs = 300_000;
const fetch = globalThis.fetch;

export function parseArgs(argv) {
  const parsed = {
    model: undefined,
    params: [],
    promptFile: undefined,
    patchFile: undefined,
    outFile: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(usage);
    }

    if (flag === '--model') parsed.model = value;
    else if (flag === '--prompt') parsed.promptFile = value;
    else if (flag === '--patch') parsed.patchFile = value;
    else if (flag === '--out') parsed.outFile = value;
    else if (flag === '--param') {
      const separator = value.indexOf('=');
      if (separator <= 0 || separator === value.length - 1) throw new Error(usage);
      parsed.params.push({ id: value.slice(0, separator), value: value.slice(separator + 1) });
    } else {
      throw new Error(usage);
    }
    index += 1;
  }

  if (!parsed.model || !parsed.promptFile || !parsed.patchFile || !parsed.outFile) {
    throw new Error(usage);
  }
  return parsed;
}

export function buildCreateRequest({ model, params, promptText, patchText, apiKey }) {
  const body = {
    prompt: { text: `${promptText}\n\n\`\`\`diff\n${patchText}\n\`\`\`` },
    model: { id: model },
  };
  if (params.length > 0) body.model.params = params;

  return {
    url: `${apiUrl}/agents`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(body),
    },
  };
}

function scrub(text, apiKey) {
  if (!apiKey) return text;
  const encodedKey = Buffer.from(`${apiKey}:`).toString('base64');
  return text
    .replaceAll(apiKey, '[redacted]')
    .replaceAll(`Basic ${encodedKey}`, '[redacted]')
    .replaceAll(encodedKey, '[redacted]');
}

async function logHttpFailure(response, callName, apiKey, safeLog) {
  const responseBody = scrub(await response.text(), apiKey).slice(0, 500);
  safeLog(`Cursor ${callName} call failed with HTTP ${response.status}: ${responseBody}`);
}

async function readDoneEvent(response) {
  if (!response.body) throw new Error('Missing event stream');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const events = pending.split(/\r?\n\r?\n/);
      pending = events.pop() ?? '';
      for (const eventText of events) {
        const lines = eventText.split(/\r?\n/);
        if (lines.some((line) => line === 'event: done')) return true;
      }
      if (done) return false;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export async function main(argv, dependencies) {
  const {
    env,
    fetch: fetchImpl,
    readFile: readFileImpl,
    writeFile: writeFileImpl,
    log,
    now,
  } = dependencies;
  let apiKey = env.CURSOR_API_KEY;
  let startedAt;
  const safeLog = (message) => log(scrub(message, apiKey ?? ''));
  try {
    const args = parseArgs(argv);
    if (!apiKey) {
      safeLog('CURSOR_API_KEY is required.');
      return 1;
    }
    startedAt = now();
    const signal = globalThis.AbortSignal.timeout(deadlineMs);
    const [promptText, patchText] = await Promise.all([
      readFileImpl(args.promptFile, 'utf8'),
      readFileImpl(args.patchFile, 'utf8'),
    ]);
    const createRequest = buildCreateRequest({ ...args, promptText, patchText, apiKey });
    const createResponse = await fetchImpl(createRequest.url, {
      ...createRequest.init,
      signal,
    });
    if (!createResponse.ok) {
      await logHttpFailure(createResponse, 'create', apiKey, safeLog);
      return 1;
    }

    const created = await createResponse.json();
    const agentId = created?.agent?.id;
    const runId = created?.run?.id;
    if (typeof agentId !== 'string' || typeof runId !== 'string') {
      safeLog('Cursor create response was invalid.');
      return 1;
    }

    const headers = {
      Accept: 'text/event-stream',
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
    };
    const streamResponse = await fetchImpl(
      `${apiUrl}/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}/stream`,
      { headers, signal },
    );
    if (!streamResponse.ok) {
      await logHttpFailure(streamResponse, 'stream', apiKey, safeLog);
      return 1;
    }
    if (!(await readDoneEvent(streamResponse))) {
      safeLog('Cursor run stream ended before the done event.');
      return 1;
    }

    const runResponse = await fetchImpl(
      `${apiUrl}/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`,
      { headers: { Authorization: headers.Authorization }, signal },
    );
    if (!runResponse.ok) {
      await logHttpFailure(runResponse, 'run', apiKey, safeLog);
      return 1;
    }
    const run = await runResponse.json();
    if (run?.status !== 'FINISHED') {
      safeLog(`Cursor run ended with status ${String(run?.status)}.`);
      return 1;
    }
    if (typeof run?.result !== 'string') {
      safeLog('Cursor run result was not text.');
      return 1;
    }

    const elapsedSeconds = (now() - startedAt) / 1000;
    const metadata = [
      `Model: ${args.model}`,
      ...args.params.map(({ id, value }) => `Param ${id}: ${value}`),
      `Agent: ${agentId}`,
      `Run: ${runId}`,
      `Status: ${run.status}`,
      `Elapsed: ${elapsedSeconds} seconds`,
    ].join('\n');
    await writeFileImpl(args.outFile, scrub(`${metadata}\n---\n${run.result}`, apiKey));
    safeLog(`${run.status} in ${elapsedSeconds} seconds; wrote ${args.outFile}`);
    return 0;
  } catch (error) {
    const elapsedSeconds = startedAt === undefined ? 0 : (now() - startedAt) / 1000;
    const errorName = error instanceof Error ? error.name : typeof error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (elapsedSeconds >= deadlineMs / 1000) {
      safeLog(
        `Run failed after ${elapsedSeconds} seconds (300-second deadline): ${errorName}: ${errorMessage}`,
      );
    } else {
      safeLog(`${errorName}: ${errorMessage}`);
    }
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const code = await main(process.argv.slice(2), {
    env: process.env,
    fetch,
    readFile,
    writeFile,
    log: console.log,
    now: Date.now,
  });
  process.exitCode = code;
}
