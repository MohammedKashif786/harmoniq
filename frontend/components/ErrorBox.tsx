export default function ErrorBox({ message }: { message: string }) {
  return (
    <main className="wrap">
      <div className="panel">
        <h2>Could not load data</h2>
        <p className="muted">{message}</p>
        <p className="muted small">
          Check that frontend/.env.local has your Supabase URL and publishable key, then restart the dev server.
        </p>
      </div>
    </main>
  );
}
