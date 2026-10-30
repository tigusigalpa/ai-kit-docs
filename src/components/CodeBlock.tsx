import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { T } from '../i18n';
import { Icon } from './Icon';

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function CopyButton({ text, t, label, className = 'copy-button' }: { text: string; t: T; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    setState(await copyText(text) ? 'done' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2200);
  };
  return <button type="button" className={className} onClick={copy} data-state={state}>
    <Icon name={state === 'done' ? 'check' : 'copy'} size={15}/>
    <span>{state === 'done' ? t('Copied', 'Скопировано') : state === 'failed' ? t('Select and copy', 'Выделите вручную') : label ?? t('Copy', 'Копировать')}</span>
    <span className="sr-only" role="status">{state === 'done' ? t('Copied to clipboard', 'Скопировано в буфер обмена') : ''}</span>
  </button>;
}

export function CodeBlock({ code, t, title, lang, step, tone, children }: {
  code: string; t: T; title?: ReactNode; lang?: string; step?: string; tone?: 'apply' | 'muted'; children?: ReactNode;
}) {
  return <figure className="code-block" data-tone={tone}>
    <figcaption className="code-head">
      {step && <span className="code-step">{step}</span>}
      <span className="code-title">{title}</span>
      {lang && <span className="code-lang">{lang}</span>}
      <CopyButton text={code} t={t}/>
    </figcaption>
    <pre tabIndex={0}><code>{code}</code></pre>
    {children && <div className="code-note">{children}</div>}
  </figure>;
}

export function Segmented<V extends string>({ label, value, options, onChange, name }: {
  label: string; name: string; value: V; options: readonly { value: V; label: ReactNode; hint?: string }[]; onChange: (value: V) => void;
}) {
  return <div className="segmented" role="radiogroup" aria-label={label}>
    {options.map(option => <label key={option.value} className="segmented-option" data-checked={option.value === value} title={option.hint}>
      <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)}/>
      <span>{option.label}</span>
    </label>)}
  </div>;
}
