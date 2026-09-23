function toWhatsAppNumber(phone) {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('0')) return `33${digits.slice(1)}`;
  return digits;
}

export default function WhatsAppButton({ phone }) {
  if (!phone) return null;
  const href = `https://wa.me/${toWhatsAppNumber(phone)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactez-nous sur WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.32 4.95L2 22l5.2-1.36a9.96 9.96 0 0 0 4.84 1.23h.01c5.52 0 10-4.48 10-10s-4.49-9.87-10.01-9.87Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.09.81.83-3.01-.2-.31a8.16 8.16 0 0 1-1.26-4.32c0-4.52 3.68-8.2 8.21-8.2 2.19 0 4.25.86 5.8 2.4a8.14 8.14 0 0 1 2.4 5.8c0 4.53-3.68 8.15-8.2 8.15Zm4.5-6.13c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.43.06-.65.31-.23.25-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.17 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
      </svg>
    </a>
  );
}
