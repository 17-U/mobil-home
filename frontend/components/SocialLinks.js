const ICONS = [
  { key: 'facebook', label: 'Facebook', path: 'M13 22v-8h2.7l.4-3.3H13V8.7c0-.95.3-1.7 1.7-1.7H16V4.1C15.6 4 14.6 4 13.5 4 11 4 9.3 5.5 9.3 8.3v2.4H6.6V14h2.7v8h3.7Z' },
  { key: 'instagram', label: 'Instagram', path: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6ZM12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm6.4-.3a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0ZM7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Z' },
  { key: 'linkedin', label: 'LinkedIn', path: 'M6.9 8.6H3.5V21H6.9V8.6ZM5.2 3.2A2 2 0 1 0 5.2 7.2a2 2 0 0 0 0-4ZM21 13.9c0-3.4-1.8-5-4.2-5-1.9 0-2.8 1.1-3.2 1.8V9h-3.4v12h3.4v-6.7c0-.4 0-.8.2-1.1.3-.7.9-1.4 2-1.4 1.4 0 2 1.1 2 2.7V21H21v-7.1Z' },
];

export default function SocialLinks({ social, className = '', iconClassName = 'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-sun' }) {
  const links = ICONS.filter((i) => social?.[i.key]);
  if (links.length === 0) return null;

  return (
    <div className={`flex gap-3 ${className}`}>
      {links.map((s) => (
        <a
          key={s.key}
          href={social[s.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className={iconClassName}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
        </a>
      ))}
    </div>
  );
}
