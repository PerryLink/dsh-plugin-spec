import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const STD = path.resolve(HERE, '..', '..')
const SCRIPT = path.join(STD, '40-checker', 'scripts', 'entry-validate.mjs')
const FIXTURES = path.join(STD, 'adoption', 'entry', 'fixtures')

function run(name, withMeta = true) {
  const dir = path.join(FIXTURES, name)
  const args = [SCRIPT, dir, '--json']
  const meta = path.join(dir, 'meta.json')
  if (withMeta && fs.existsSync(meta)) args.push('--meta', meta)
  return spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 30_000 })
}


function runWith(name, extra) {
  const dir = path.join(FIXTURES, name)
  const meta = path.join(dir, 'meta.json')
  const args = [SCRIPT, dir, '--json']
  if (fs.existsSync(meta)) args.push('--meta', meta)
  args.push(...extra)
  return spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 30_000 })
}

function result(name, withMeta = true) {
  const out = run(name, withMeta)
  assert.ok(out.stdout, out.stderr)
  return { out, json: JSON.parse(out.stdout) }
}

test('entry-validate: the good fixture passes C1-C8', () => {
  const { out, json } = result('good')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.conclusion.status, 'pass')
  assert.deepEqual(json.conclusion.failed, [])
  assert.deepEqual(json.conclusion.notRun, [])
})

test('entry-validate: missing meta is incomplete, never a pass', () => {
  const { out, json } = result('no-meta', false)
  assert.equal(out.status, 3)
  assert.equal(json.conclusion.status, 'incomplete')
  assert.ok(json.conclusion.notRun.includes('C1'))
  assert.ok(json.conclusion.notRun.includes('C7'))
})

const failures = [
  ['client-only', 'C2'],
  ['missing-patch', 'C2'],
  ['engines-star', 'C4'],
  ['client-no-export', 'C5'],
  ['no-metadata', 'C6'],
  ['no-version', 'C7'],
  ['forbidden-label', 'C8'],
]

for (const [name, id] of failures) {
  test(`entry-validate: ${name} fails ${id}`, () => {
    const { out, json } = result(name)
    assert.equal(out.status, 2, out.stderr)
    assert.equal(json.conclusion.status, 'fail')
    assert.ok(json.conclusion.failed.includes(id), JSON.stringify(json.conclusion))
  })
}

test('entry-validate: a peer range is an accepted C4 source', () => {
  const { out, json } = result('peer-ok')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.checks.find(row => row.id === 'C4').status, 'pass')
})

test('entry-validate: a declared but uncommitted build output is a warning, not a fail', () => {
  const { out, json } = result('build-output')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.conclusion.status, 'pass-with-warnings')
  assert.ok(json.conclusion.warnings.includes('C5'))
  assert.equal(json.checks.find(row => row.id === 'C6').status, 'pass')
  assert.deepEqual(json.conclusion.failed, [])
})

test('entry-validate: an ordered dsh.bundle.patch list is accepted', () => {
  const { out, json } = result('patch-list')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.checks.find(row => row.id === 'C2').status, 'pass')
  assert.equal(json.conclusion.status, 'pass')
})

function hostEvidence(status) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-entry-host-'))
  const file = path.join(dir, 'host.json')
  fs.writeFileSync(file, JSON.stringify({
    status,
    command: 'dsh plugin --profile test add @dsh-fixtures/entry-good',
    host: 'dsh 0.2.2-alpha.2 / cordis 4.0.6-alpha.1',
    evidence: 'https://example.invalid/host-install/1',
    generatedAt: '2026-11-02',
  }))
  return { dir, file, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) }
}

test('entry-validate: a passed host install upgrades C3 to pass', () => {
  const h = hostEvidence('pass')
  try {
    const out = spawnSync(process.execPath, [SCRIPT, path.join(FIXTURES, 'good'), '--json', '--meta', path.join(FIXTURES, 'good', 'meta.json'), '--host-evidence', h.file], { encoding: 'utf8', timeout: 30_000 })
    assert.equal(out.status, 0, out.stderr)
    const json = JSON.parse(out.stdout)
    assert.equal(json.checks.find(row => row.id === 'C3').status, 'pass')
    assert.equal(json.conclusion.status, 'pass')
  } finally { h.cleanup() }
})

test('entry-validate: a failed host install fails C3', () => {
  const h = hostEvidence('fail')
  try {
    const out = spawnSync(process.execPath, [SCRIPT, path.join(FIXTURES, 'good'), '--json', '--meta', path.join(FIXTURES, 'good', 'meta.json'), '--host-evidence', h.file], { encoding: 'utf8', timeout: 30_000 })
    assert.equal(out.status, 2)
    const json = JSON.parse(out.stdout)
    assert.equal(json.checks.find(row => row.id === 'C3').status, 'fail')
    assert.ok(json.conclusion.failed.includes('C3'))
  } finally { h.cleanup() }
})

test('entry-validate: a blocked host install is incomplete, not a pass', () => {
  const h = hostEvidence('blocked')
  try {
    const out = spawnSync(process.execPath, [SCRIPT, path.join(FIXTURES, 'good'), '--json', '--meta', path.join(FIXTURES, 'good', 'meta.json'), '--host-evidence', h.file], { encoding: 'utf8', timeout: 30_000 })
    assert.equal(out.status, 3)
    const json = JSON.parse(out.stdout)
    assert.equal(json.checks.find(row => row.id === 'C3').status, 'blocked')
    assert.ok(json.conclusion.blocked.includes('C3'))
    assert.equal(json.conclusion.status, 'incomplete')
  } finally { h.cleanup() }
})

test('entry-validate: C3 is flow-only when no host evidence is supplied', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-c3-flow-'))
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'good', 'meta.json'), 'utf8'))
    delete meta.installCommand
    const metaFile = path.join(dir, 'meta.json')
    fs.writeFileSync(metaFile, JSON.stringify(meta))
    const out = spawnSync(process.execPath, [SCRIPT, path.join(FIXTURES, 'good'), '--json', '--meta', metaFile], { encoding: 'utf8', timeout: 30_000 })
    assert.equal(out.status, 0, out.stderr)
    const json = JSON.parse(out.stdout)
    assert.equal(json.checks.find(row => row.id === 'C3').status, 'not-applicable')
    assert.equal(json.conclusion.status, 'pass')
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test('entry-validate: host evidence can mark C3 not-applicable for a host/directory sample', () => {
  const h = hostEvidence('not-applicable')
  try {
    const out = spawnSync(process.execPath, [SCRIPT, path.join(FIXTURES, 'good'), '--json', '--meta', path.join(FIXTURES, 'good', 'meta.json'), '--host-evidence', h.file], { encoding: 'utf8', timeout: 30_000 })
    assert.equal(out.status, 0, out.stderr)
    const json = JSON.parse(out.stdout)
    assert.equal(json.checks.find(row => row.id === 'C3').status, 'not-applicable')
    assert.equal(json.conclusion.status, 'pass')
  } finally { h.cleanup() }
})

test('entry-validate: a missing license is A7 advisory, not a C6 fail', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-c6-license-'))
  try {
    const src = path.join(FIXTURES, 'good')
    for (const name of ['index.js', 'client.js', 'cordis.patch.yml', 'meta.json']) fs.copyFileSync(path.join(src, name), path.join(dir, name))
    const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'))
    delete pkg.license
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg))
    const out = spawnSync(process.execPath, [SCRIPT, dir, '--json', '--meta', path.join(dir, 'meta.json')], { encoding: 'utf8', timeout: 30_000 })
    assert.equal(out.status, 0, out.stderr)
    const json = JSON.parse(out.stdout)
    assert.equal(json.checks.find(row => row.id === 'C6').status, 'pass')
    assert.ok(json.advisories.some(row => row.id === 'A7'))
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

test('C4: engines.dsh alone is the authoritative declaration', () => {
  const { out, json } = result('c4-engines-only')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.checks.find(row => row.id === 'C4').status, 'pass')
})

test('C4: a conflicting peer next to engines.dsh is a warning (host ignores peer)', () => {
  const { out, json } = result('c4-both-conflict')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.conclusion.status, 'pass-with-warnings')
  assert.equal(json.checks.find(row => row.id === 'C4').status, 'warn')
  assert.ok(json.conclusion.warnings.includes('C4'))
  assert.deepEqual(json.conclusion.failed, [])
})

test('C4: engines.dsh wins over a peer even when the engines range is old (static cannot judge host fit)', () => {
  // Static C4 only judges precedence and well-formedness. Whether "<0.0.1" fits the running
  // host is an install-time fact (see C4-MATRIX.md); the host rejects it at `dsh plugin add`.
  const { out, json } = result('c4-engines-bad-peer-ok')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.checks.find(row => row.id === 'C4').status, 'warn')
  assert.match(json.checks.find(row => row.id === 'C4').detail, /engines\.dsh/)
})

test('C4: no engines and no peer is a warning, not a fail', () => {
  const { out, json } = result('c4-neither')
  assert.equal(out.status, 0, out.stderr)
  assert.equal(json.checks.find(row => row.id === 'C4').status, 'warn')
})

test('C4 --host-version: a matching range stays pass', () => {
  const out = runWith('c4-host-match', ['--host-version', '0.2.1-rc.5'])
  assert.equal(out.status, 0, out.stderr)
  const json = JSON.parse(out.stdout)
  const c4 = json.checks.find(row => row.id === 'C4')
  assert.equal(c4.status, 'pass')
  assert.match(c4.detail, /matches --host-version 0\.2\.1-rc\.5/)
})

test('C4 --host-version: a non-matching engines range is a warning, not a fail', () => {
  const out = runWith('c4-engines-only', ['--host-version', '0.2.1-rc.5'])
  assert.equal(out.status, 0, out.stderr)
  const json = JSON.parse(out.stdout)
  const c4 = json.checks.find(row => row.id === 'C4')
  assert.equal(c4.status, 'warn')
  assert.match(c4.detail, /does not match --host-version/)
})

test('C4 --host-version: engines still wins when a conflicting peer is present', () => {
  const out = runWith('c4-both-conflict', ['--host-version', '0.2.1-rc.5'])
  assert.equal(out.status, 0, out.stderr)
  const json = JSON.parse(out.stdout)
  const c4 = json.checks.find(row => row.id === 'C4')
  assert.equal(c4.status, 'warn')
  assert.match(c4.detail, /engines\.dsh/)
  assert.match(c4.detail, /ignored by the host/)
})

test('C4 --host-version: peer fallback keeps working and can warn on mismatch', () => {
  const out = runWith('peer-ok', ['--host-version', '0.2.1-rc.5'])
  assert.equal(out.status, 0, out.stderr)
  const json = JSON.parse(out.stdout)
  const c4 = json.checks.find(row => row.id === 'C4')
  assert.equal(c4.status, 'warn')
  assert.match(c4.detail, /peer fallback/)
  assert.match(c4.detail, /does not match --host-version/)
})

test('C4 --host-version: a wide range still fails', () => {
  const out = runWith('engines-star', ['--host-version', '0.2.1-rc.5'])
  assert.equal(out.status, 2, out.stderr)
  const json = JSON.parse(out.stdout)
  assert.equal(json.checks.find(row => row.id === 'C4').status, 'fail')
})
