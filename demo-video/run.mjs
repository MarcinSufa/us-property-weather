import { spawn, spawnSync } from 'node:child_process';
import console from 'node:console';
import {
  closeSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { connect } from 'node:net';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, URL } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(here, '..');
const work = join(here, 'dist');
const buildDir = join(work, '.build');
const pluginAssets = join(
  process.env.DEMO_VIDEO_PLUGIN ??
    join(homedir(), '.claude', 'plugins', 'marketplaces', 'claude-demo-video'),
  'assets',
);
const logDir = process.env.DEMO_LOG_DIR ?? join(tmpdir(), 'covertree-video-logs');
const outDir = process.env.DEMO_OUT_DIR ?? join(tmpdir(), 'covertree-video-out');
const stateFile = join(logDir, 'servers.json');
const ports = { stub: 4274, api: 4100, web: 5273, mockups: 8765 };
const mode = process.argv[2] ?? 'build';

const patches = {
  'record-browser.mjs': [
    [
      '  viewport: { width: W, height: H },\n  deviceScaleFactor:',
      "  viewport: { width: W, height: H },\n  locale: 'en-US',\n  timezoneId: 'America/Phoenix',\n  deviceScaleFactor:",
    ],
    [
      "  (() => {\n    const dot = document.createElement('div');",
      "  document.addEventListener('DOMContentLoaded', () => {\n    const dot = document.createElement('div');",
    ],
    ['    }, true);\n  })();\n`;\n\n// Pulse', '    }, true);\n  });\n`;\n\n// Pulse'],
    ['rgba(255,255,255,', 'rgba(11,93,94,'],
    ['rgba(219,175,113,', 'rgba(11,93,94,'],
    ['background:rgba(11,93,94,0.9)', 'background:rgba(11,93,94,0.55)'],
  ],
  'build.sh': [
    ['node record-frame.mjs', 'cp videos/final-with-captions.mp4 videos/final-framed.mp4'],
  ],
  'make-captions.py': [
    ['JetBrains Mono', 'Segoe UI'],
    ['karaoke += "{\\\\k%d} " %', 'karaoke += "{\\\\k%d}" %'],
    [
      '        prev_end = line["line_start"]\n',
      '        prev_end = line["line_start"]\n        source = line["text"]\n        cursor = 0\n',
    ],
    [
      '            karaoke += "{\\\\k%d}%s " % (int(round(w["duration"] * 100)), w["text"])\n',
      [
        '            found = source.find(w["text"], cursor)',
        '            punctuation = ""',
        '            if found >= 0:',
        '                cursor = found + len(w["text"])',
        '                while cursor < len(source) and source[cursor] in ".,:;!?":',
        '                    punctuation += source[cursor]',
        '                    cursor += 1',
        '            karaoke += "{\\\\k%d}%s%s " % (',
        '                int(round(w["duration"] * 100)),',
        '                w["text"],',
        '                punctuation,',
        '            )',
        '',
      ].join('\n'),
    ],
  ],
  'make-before-after.py': [
    ['BEFORE_COLOR = "0xb91c1c"', 'BEFORE_COLOR = "0x4a5868"'],
    ['AFTER_COLOR = "0x15803d"', 'AFTER_COLOR = "0x0b5d5e"'],
  ],
};

function portIsOpen(port) {
  return new Promise((resolve) => {
    const socket = connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function waitForPort(name, port) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await portIsOpen(port)) return;
    await sleep(200);
  }
  throw new Error(`${name} did not open port ${port}`);
}

async function reportPorts() {
  for (const [name, port] of Object.entries(ports)) {
    console.log(`port ${port} (${name}) ${(await portIsOpen(port)) ? 'STILL OPEN' : 'free'}`);
  }
}

function prepareWorkDir() {
  for (const name of ['.build', 'videos', 'plugin', 'templates']) {
    rmSync(join(work, name), { recursive: true, force: true });
  }
  mkdirSync(buildDir, { recursive: true });
  cpSync(join(pluginAssets, 'scripts'), join(work, 'plugin', 'scripts'), { recursive: true });
  cpSync(join(pluginAssets, 'templates'), join(work, 'templates'), { recursive: true });
  copyFileSync(join(here, 'brand.yaml'), join(work, 'brand.yaml'));
  for (const name of ['playwright', 'playwright-core']) {
    const target = join(work, 'node_modules', name);
    if (!existsSync(target)) {
      cpSync(join(repoRoot, 'node_modules', name), target, { recursive: true });
    }
  }
  for (const [file, replacements] of Object.entries(patches)) {
    const path = join(work, 'plugin', 'scripts', file);
    let source = readFileSync(path, 'utf8');
    for (const [from, to] of replacements) {
      if (!source.includes(from)) throw new Error(`patch target not found in ${file}: ${from}`);
      source = source.split(from).join(to);
    }
    writeFileSync(path, source);
  }
}

function start(children, name, command, args, options = {}) {
  const log = openSync(join(logDir, `${name}.log`), 'w');
  const child = spawn(command, args, {
    ...options,
    detached: mode === 'serve',
    stdio: ['ignore', log, log],
  });
  closeSync(log);
  children.push({ name, child });
  console.log(`${name} pid ${child.pid}`);
}

async function startServers() {
  for (const [name, port] of Object.entries(ports)) {
    if (await portIsOpen(port)) throw new Error(`port ${port} (${name}) is already in use`);
  }
  const dataDir = mkdtempSync(join(tmpdir(), 'covertree-demo-'));
  const children = [];
  start(children, 'stub', process.execPath, [join(here, 'weather-stub.mjs')], {
    env: { ...process.env, STUB_PORT: String(ports.stub) },
  });
  start(children, 'api', process.execPath, ['src/main.ts'], {
    cwd: join(repoRoot, 'apps', 'api'),
    env: {
      ...process.env,
      PORT: String(ports.api),
      DATABASE_PATH: join(dataDir, 'properties.db'),
      WEATHERSTACK_BASE_URL: `http://127.0.0.1:${ports.stub}`,
      WEATHERSTACK_API_KEY: 'demo-stub-key',
      LOG_LEVEL: 'info',
    },
  });
  start(
    children,
    'web',
    process.execPath,
    [join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '--config', 'vite.config.mjs'],
    { cwd: here },
  );
  start(
    children,
    'mockups',
    'python',
    [
      '-m',
      'http.server',
      String(ports.mockups),
      '--bind',
      '127.0.0.1',
      '--directory',
      join(here, 'mockups'),
    ],
    { cwd: here },
  );
  writeFileSync(
    stateFile,
    JSON.stringify({
      dataDir,
      pids: Object.fromEntries(children.map(({ name, child }) => [name, child.pid])),
    }),
  );
  for (const [name, port] of Object.entries(ports)) await waitForPort(name, port);
  return children;
}

async function stopServers() {
  if (existsSync(stateFile)) {
    const { dataDir, pids } = JSON.parse(readFileSync(stateFile, 'utf8'));
    for (const [name, pid] of Object.entries(pids)) {
      try {
        process.kill(pid);
        console.log(`stopped ${name} pid ${pid}`);
      } catch {
        console.log(`${name} pid ${pid} was not running`);
      }
    }
    await sleep(1500);
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(stateFile);
  }
  await reportPorts();
}

function runLogged(logName, command, args, options = {}) {
  const log = openSync(join(logDir, logName), 'w');
  const result = spawnSync(command, args, { ...options, stdio: ['ignore', log, log] });
  closeSync(log);
  return result.status ?? 1;
}

function runPlugin(logName, args) {
  return runLogged(logName, 'bash', [join(work, 'plugin', 'scripts', 'build.sh'), ...args], {
    cwd: work,
  });
}

function videoSeconds(path) {
  const probe = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
    { encoding: 'utf8' },
  );
  return Number(probe.stdout.trim());
}

function exportFilms() {
  mkdirSync(outDir, { recursive: true });
  const film = join(outDir, 'covertree-demo.mp4');
  copyFileSync(join(work, 'videos', 'final-with-captions.mp4'), film);
  const { scenes } = JSON.parse(readFileSync(join(buildDir, 'config.json'), 'utf8'));
  const crossfade = scenes.crossfade_seconds;
  const normalized = readdirSync(join(buildDir, '.normalized')).length;
  if (normalized !== scenes.sequence.length) throw new Error('scene clips do not match the plan');
  let sceneStart = 0;
  scenes.sequence.forEach((scene, index) => {
    const seconds = videoSeconds(join(buildDir, '.normalized', `s${index + 1}.mp4`));
    if (scene.export) {
      const from = sceneStart + crossfade;
      const length = seconds - 2 * crossfade;
      const status = runLogged(`export-${scene.export}.log`, 'ffmpeg', [
        '-y',
        '-hide_banner',
        '-ss',
        from.toFixed(3),
        '-i',
        film,
        '-t',
        length.toFixed(3),
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-movflags',
        '+faststart',
        join(outDir, `${scene.export}.mp4`),
      ]);
      if (status !== 0) throw new Error(`export of ${scene.export} failed`);
      console.log(`${scene.export}: ${from.toFixed(2)}s to ${(from + length).toFixed(2)}s`);
    }
    sceneStart += seconds - crossfade;
  });
}

mkdirSync(logDir, { recursive: true });
if (mode === 'stop') {
  await stopServers();
} else if (mode === 'serve') {
  for (const { child } of await startServers()) child.unref();
  console.log('serving, stop with: node demo-video/run.mjs stop');
} else if (mode === 'plan') {
  prepareWorkDir();
  process.exitCode = runPlugin('plan.log', ['--plan']);
} else {
  try {
    prepareWorkDir();
    await startServers();
    process.exitCode = runPlugin(`build-${Date.now()}.log`, ['--no-cache']);
    console.log(`build exit ${process.exitCode}`);
    if (process.exitCode === 0) exportFilms();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await stopServers();
  }
}
