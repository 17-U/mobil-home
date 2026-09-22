export const metadata = { title: 'Administration', robots: { index: false, follow: false } };

export default function AdminRoot({ children }) {
  return <div className="min-h-dvh bg-mist">{children}</div>;
}
