'use client';

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="id" style={{ colorScheme: 'light dark' }}>
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5, textAlign: 'center' }}>
        <title>Terjadi kendala · Invitesion</title>
        <main>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Terjadi kendala</h1>
          <p style={{ margin: 0 }}>Halaman gagal dimuat. Silakan coba lagi.</p>
          <p lang="en" style={{ margin: '4px 0 20px' }}>
            Something went wrong. Please try again.
          </p>
          <button type="button" onClick={() => retry()} style={{ font: 'inherit', padding: '8px 16px', cursor: 'pointer' }}>
            Coba lagi · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
