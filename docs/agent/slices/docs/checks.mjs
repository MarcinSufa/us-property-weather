import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildSchema, parse, validate } from 'graphql';

const base = 'fca2bd7';
const wave2 = new Set([
  'e2e/playwright.config.ts',
  'e2e/weatherstack-stub.ts',
  'e2e/stories.spec.ts',
  'scripts/export-sessions.ts',
  '.github/workflows/verify.yml',
  'docs/agent/session-metrics.md',
  'docs/agent/sessions/',
  'docs/agent/slices/<slice>/',
  'apps/api/src/weather/fixtures/',
  '.env',
]);
const onMain = new Set(['docs/agent/review-log.md']);
const ownedHere = new Set(['README.md', 'docs/agent/skills/', 'docs/agent/skills/README.md']);
const recordRoot = 'docs/agent/';
const recordEntries = [
  'prompts/',
  'decisions-log.md',
  'manager-state.md',
  'briefs/',
  'handoffs/',
  'slices/<slice>/',
  'reviews/',
  'review-log.md',
  'session-metrics.md',
  'sessions/',
  'skills/',
];

const readmePath = process.argv[2] ?? 'README.md';
const readme = readFileSync(readmePath, 'utf8');
const skillsReadme = readFileSync('docs/agent/skills/README.md', 'utf8');
let failed = false;
const fail = (message) => {
  failed = true;
  console.log(`FAIL ${message}`);
};

console.log('## 1. npm scripts named in README.md exist in the root package.json');
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts;
const named = new Set([...readme.matchAll(/npm run ([a-z0-9:-]+)/g)].map((match) => match[1]));
for (const name of named) {
  if (scripts[name]) console.log(`ok   npm run ${name}`);
  else fail(`npm run ${name} is not a root script`);
}
if (named.size === 0) fail('no npm script found in README.md');

console.log(`\n## 2. paths named exist at ${base}, are created by this slice, or are listed for wave 2`);
const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', base], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const existsAtBase = (path) =>
  path.endsWith('/')
    ? tracked.some((file) => file.startsWith(path))
    : tracked.includes(path) || tracked.some((file) => file.startsWith(path + '/'));
const pathPattern = /`([A-Za-z0-9_.<>/-]+)`/g;
const looksLikePath = (text) =>
  /^(apps|docs|e2e|scripts|\.github)\//.test(text) ||
  /^[A-Za-z0-9_.-]+\.(md|json|mjs|ts|tsx|graphql|yml)$/.test(text) ||
  /^\.(env|nvmrc)/.test(text);
const candidates = new Map();
const collect = (text, file, prefix = '') => {
  for (const match of text.matchAll(pathPattern)) {
    const raw = match[1];
    if (prefix && recordEntries.includes(raw)) candidates.set(prefix + raw, file);
    else if (looksLikePath(raw)) candidates.set(raw, file);
  }
};
collect(readme, 'README.md', recordRoot);
for (const match of skillsReadme.matchAll(pathPattern)) {
  const raw = match[1];
  if (/^(grilling|handoff)\//.test(raw)) candidates.set(`docs/agent/skills/${raw}`, 'skills/README.md');
  else if (looksLikePath(raw)) candidates.set(raw, 'skills/README.md');
}
const sourceRelative = new Map([
  ['main.ts', 'apps/api/src/main.ts'],
  ['SKILL.md', 'docs/agent/skills/grilling/SKILL.md'],
]);
for (const [path, file] of [...candidates].sort()) {
  const resolved = sourceRelative.get(path) ?? path;
  if (existsAtBase(resolved)) console.log(`ok   ${path} (${file}): at ${base}`);
  else if (ownedHere.has(resolved) || (resolved.startsWith('docs/agent/skills/') && existsSync(resolved)))
    console.log(`ok   ${path} (${file}): created by this slice`);
  else if (onMain.has(resolved)) console.log(`ok   ${path} (${file}): on main since the base commit`);
  else if (wave2.has(resolved)) console.log(`ok   ${path} (${file}): to check in wave 2`);
  else fail(`${path} (${file}) does not exist and is not listed for wave 2`);
}

console.log('\n## 3. example operations are valid against apps/api/schema.graphql');
const schema = buildSchema(readFileSync('apps/api/schema.graphql', 'utf8'));
const blocks = [...readme.matchAll(/```graphql\n([\s\S]*?)```/g)].map((match) => match[1]);
if (blocks.length !== 6) fail(`expected 6 graphql blocks, found ${blocks.length}`);
const fields = new Set();
for (const block of blocks) {
  const document = parse(block);
  const errors = validate(schema, document);
  const definition = document.definitions[0];
  const field = definition.selectionSet.selections[0].name.value;
  const args = (definition.selectionSet.selections[0].arguments ?? []).map((arg) => arg.name.value).join(',');
  fields.add(`${field}(${args})`);
  if (errors.length > 0) fail(`${definition.name.value}: ${errors.map((error) => error.message).join('; ')}`);
  else console.log(`ok   ${definition.operation} ${definition.name.value}: ${field}(${args})`);
}
for (const expected of [
  'properties()',
  'properties(sort)',
  'properties(filter)',
  'property(id)',
  'createProperty(input)',
  'deleteProperty(id)',
]) {
  if (!fields.has(expected)) fail(`no example for ${expected}`);
}

console.log('\n## 4. no long dash and no email pattern in the owned paths');
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name).replaceAll('\\', '/');
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const owned = ['README.md', ...walk('docs/agent/skills')];
const dash = new RegExp(`[${String.fromCharCode(0x2012)}-${String.fromCharCode(0x2015)}]`);
const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
for (const file of owned) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let clean = true;
  lines.forEach((line, index) => {
    if (dash.test(line)) {
      clean = false;
      fail(`${file}:${index + 1} long dash`);
    }
    if (email.test(line)) {
      clean = false;
      fail(`${file}:${index + 1} email pattern`);
    }
  });
  if (clean) console.log(`ok   ${file} (${lines.length} lines)`);
}
const planted = `a ${String.fromCharCode(0x2014)} b, someone${String.fromCharCode(64)}example.org`;
console.log(
  `self-test on a planted sample: dash ${dash.test(planted) ? 'hit' : 'MISSED'}, email ${email.test(planted) ? 'hit' : 'MISSED'}`,
);
if (!dash.test(planted) || !email.test(planted)) fail('the patterns do not hit a planted sample');

console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: PASS');
process.exit(failed ? 1 : 0);
