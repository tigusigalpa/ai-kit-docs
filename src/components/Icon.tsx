const PATHS = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2.5"/><path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8"/></>,
  github: <path d="M9 19c-4 1.3-4-2-6-2.5m12 5.5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V22"/>,
  terminal: <><rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="m7 9 3 3-3 3m5 0h5"/></>,
  shield: <><path d="M12 2.5 20 5.5v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
  memory: <><path d="M9 4.5A3 3 0 0 0 4.5 7a3 3 0 0 0-1 5 3 3 0 0 0 2 4.5A3 3 0 0 0 9 19.5h.5V4.5z"/><path d="M15 4.5A3 3 0 0 1 19.5 7a3 3 0 0 1 1 5 3 3 0 0 1-2 4.5 3 3 0 0 1-3.5 3h-.5V4.5z"/><path d="M9.5 9H7m2.5 6H7m7.5-6H17m-2.5 6H17"/></>,
  layers: <><path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/></>,
  route: <><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/></>,
  users: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/></>,
  box: <><path d="m12 2.5 8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="m3.7 7.4 8.3 4.7 8.3-4.7M12 12.1v9.3"/></>,
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7zm7 11c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3z"/>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2 0-1.6-1.5-2-1.5-3.3 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4-4-7-9-7z"/><circle cx="7.5" cy="11.5" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15.5" cy="8" r="1.2"/></>,
  loop: <><path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/></>,
  file: <><path d="M13.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8.5z"/><path d="M13.5 2.5v6h6"/></>,
  folder: <path d="M3 6.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  chevron: <path d="m9 6 6 6-6 6"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  link: <><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></>,
  alert: <><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4.5m0 3.5h.01"/></>,
  info: <><circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 7.5h.01"/></>,
  reset: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 3.5v5h5"/></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></>,
  external: <path d="M14 4h6v6m0-6-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>,
  python: <><path d="M11.8 2.5c-4.6 0-4.3 2-4.3 2v2.6h4.4v.7H5.7S2.5 7.4 2.5 12.1s2.8 4.5 2.8 4.5h1.7v-2.2s-.1-2.8 2.8-2.8h4.3s2.6 0 2.6-2.6V4.9s.4-2.4-4.9-2.4z"/><path d="M12.2 21.5c4.6 0 4.3-2 4.3-2v-2.6h-4.4v-.7h6.2s3.2.4 3.2-4.3-2.8-4.5-2.8-4.5H17v2.2s.1 2.8-2.8 2.8H9.9s-2.6 0-2.6 2.6v4.1s-.4 2.4 4.9 2.4z"/></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>;
}

/** AI-KIT mark: a context bracket holding a remembered spark. */
export function Logo({ size = 34 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <rect width="40" height="40" rx="11" fill="var(--logo-bg)"/>
    <path d="M15 11.5h-3.5v17H15m10-17h3.5v17H25" fill="none" stroke="var(--logo-fg)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 13.5c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6z" fill="var(--logo-spark)"/>
  </svg>;
}
