// Passes quoted values through real shells, when installed, and checks the argv a program receives.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { quote } from '../src/domain/shell';

const VALUES = ['.', 'C:\\Projects\\Client Site', "O'Brien", 'Русский язык', '$HOME', 'a;b&c|d', '(x) [y] {z}', 'a,b', '@x', 'tab\tless', '100%', 'back`tick', '#hash', '*.md'];
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
const has = (command: string, args: string[]) => spawnSync(command, args, { encoding: 'utf8' }).status === 0;

describe.skipIf(!has('bash', ['-c', 'true']))('bash quoting', () => {
  it.each(VALUES.filter(value => !value.includes('\t')))('%s', value => {
    const result = spawnSync('bash', ['-c', `printf '%s' ${quote(value, 'posix')}`], { encoding: 'utf8' });
    expect(result.stdout).toBe(value);
  });
});

const powershell = ['pwsh', 'powershell'].find(command => has(command, ['-NoProfile', '-Command', 'exit 0']));

describe.skipIf(!powershell || !has(PYTHON, ['--version']))('PowerShell quoting', () => {
  it('passes every value intact to a native program', () => {
    const values = VALUES.filter(value => !value.includes('\t'));
    // -EncodedCommand keeps non-ASCII script text independent of the console code page; JSON output stays ASCII.
    const script = `& ${PYTHON} -I -c "import sys, json; print(json.dumps(sys.argv[1:]))" ${values.map(value => quote(value, 'powershell')).join(' ')}`;
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const result = spawnSync(powershell!, ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { encoding: 'utf8' });
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout.trim().split('\n').at(-1)!)).toEqual(values);
  });
});
