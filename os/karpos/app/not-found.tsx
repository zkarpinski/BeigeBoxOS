import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#7dd3fc',
        backgroundImage: `
          linear-gradient(90deg, rgba(10, 10, 10, 0.06) 1px, transparent 1px),
          linear-gradient(rgba(10, 10, 10, 0.06) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="karp-404-title"
        style={{
          maxWidth: 420,
          width: '100%',
          border: '3px solid #0a0a0a',
          boxShadow: '8px 8px 0 #0a0a0a',
          background: '#fffef8',
        }}
      >
        <div
          style={{
            background: '#fde047',
            borderBottom: '3px solid #0a0a0a',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 800,
          }}
        >
          <span id="karp-404-title">404 — not found</span>
          <Link
            href="/"
            aria-label="Close"
            style={{
              border: '2px solid #0a0a0a',
              background: '#f472b6',
              width: 28,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: '#0a0a0a',
              fontWeight: 900,
              boxShadow: '2px 2px 0 #0a0a0a',
            }}
          >
            ×
          </Link>
        </div>
        <div style={{ padding: 20, fontWeight: 600, lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 16px' }}>
            This path doesn&apos;t exist on KarpOS. Maybe it was never installed — or the floppy was
            a coaster.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              border: '3px solid #0a0a0a',
              background: '#22d3ee',
              color: '#0a0a0a',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '4px 4px 0 #0a0a0a',
            }}
          >
            Back to desktop
          </Link>
        </div>
      </div>
    </div>
  );
}
