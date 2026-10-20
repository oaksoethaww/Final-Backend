export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Coursework API</h1>
      <p>
        Online Course Service backend. Protected API endpoints require a bearer
        token.
      </p>
      <p>POST /api/auth/login · GET /api/course · GET /api/user</p>
    </main>
  );
}
