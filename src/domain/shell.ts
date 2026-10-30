export type Shell = 'powershell' | 'posix';

// Characters each shell passes through unchanged in a bare word.
const SAFE_POSIX = /^[A-Za-z0-9_\-./:=+,@%]+$/;
const SAFE_POWERSHELL = /^[A-Za-z0-9_\-./\\:=+]+$/;

export const literal = (value: string, shell: Shell) => shell === 'powershell'
  ? `'${value.replaceAll("'", "''")}'`
  : `'${value.replaceAll("'", `'\\''`)}'`;

/** Quote one argument value only when the shell would otherwise reinterpret it. */
export function quote(value: string, shell: Shell): string {
  if (shell === 'posix' && value.startsWith('~/')) {
    const rest = value.slice(2);
    return rest ? `~/${quote(rest, shell)}` : '~/';
  }
  const safe = shell === 'powershell' ? SAFE_POWERSHELL : SAFE_POSIX;
  return safe.test(value) ? value : literal(value, shell);
}

export const hasControlCharacters = (value: string) => [...value].some(character => {
  const code = character.charCodeAt(0);
  return code < 32 || code === 127;
});
