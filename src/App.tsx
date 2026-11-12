import { useState, type FormEvent, lazy, Suspense } from "react"
import ElsewhereHero from "./components/ui/elsewhere-hero"
import { ApiError, api, users, type User } from "./lib/database"
import "./App.css"
import "./styles/portal.css"


const PortalMaster = lazy(() => import("./components/portal/PortalMaster"))

const modules = [
  ["◌", "Academic Administration", "Classes, subjects, assignments, and student progress in one considered workspace."],
  ["✓", "Daily Attendance", "Take attendance in seconds and keep families in the loop automatically."],
  ["✦", "Automated Report Cards", "Turn marks into polished, standards-based reports without spreadsheets."],
  ["▣", "Fee Ledger", "Invoice, reconcile, and accept simulated payments from one calm ledger."],
]

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [targetRole] = useState<"Admin" | "Teacher" | "Guardian">("Admin")

  const handleQuickDemoRole = (roleName: "Admin" | "Teacher" | "Guardian") => {
    const roleKey = roleName === "Admin" ? "ADMIN" : roleName === "Teacher" ? "TEACHER" : "GUARDIAN"
    const found = users.find((u) => u.role === roleKey)
    if (found) {
      setUser(found)
    }
  }

  if (user) {
    return (
      <Suspense fallback={<div className="portal-root-3d" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div className="loading-card-3d"><div className="loading-pulse-ring" /><p>Initializing Algions 3D Node…</p></div></div>}>
        <PortalMaster initialUser={user} onSignOut={() => setUser(null)} />
      </Suspense>
    )
  }

  return (
    <main>
      <ElsewhereHero
        brand="ALGIONS ACADEMY"
       
        navCta={{ label: "Login", href: "#demo-login" }}
        headline="Run your entire school from one calm, unified workspace."
        subline="Attendance, report cards, fee ledgers, and parent updates—organized effortlessly so educators can focus on teaching."
        primaryCta={{ label: "Sign In to Portal", href: "#demo-login" }}
        signature={false}
      />

      <section className="landing" id="features">
        <div className="intro-section">
          <div className="eyebrow">A quieter way to run school</div>
          <h2>
            Everything important,
            <br />
            <em>beautifully in place.</em>
          </h2>
          <p className="section-lead">
            ALGIONS brings academic, pastoral, and financial work into one calm workspace.
          </p>
          <div className="module-grid">
            {modules.map(([icon, title, text]) => (
              <article className="module-card" key={title}>
                <span className="module-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#demo-login">Explore module →</a>
              </article>
            ))}
          </div>
        </div>

        <section className="demo-section" id="demo-login">
          <div>
            <div className="eyebrow">Ready when you are</div>
            <h2>
              See your school
              <br />
              <em>in a better light.</em>
            </h2>
            <p>Use a demo account to explore each role. No setup, no waiting.</p>

            <label className="demo-select-label">
              Quick demo login
              <select
                onChange={(e) => {
                  if (e.target.value === "open") setLoginOpen(true)
                }}
                defaultValue=""
              >
                <option value="" disabled>Choose a role…</option>
                <option value="open">Admin · 1-click demo</option>
                <option value="open">Teacher · 1-click demo</option>
                <option value="open">Guardian · 1-click demo</option>
              </select>
            </label>

            <button className="sage-button" onClick={() => setLoginOpen(true)}>
              Open demo portal →
            </button>
          </div>

          <div className="credential-card">
            <div className="credential-head">
              <span className="status-dot" />
              Quick demo login
              <small style={{ marginLeft: "auto", color: "#52b788", fontWeight: 600 }}>
                Click row to sign in instantly
              </small>
            </div>
            {[
              ["Admin", "admin@algions.edu", "Admin@123"],
              ["Teacher", "teacher@algions.edu", "Teacher@123"],
              ["Guardian", "guardian@algions.edu", "Guardian@123"],
            ].map(([role, email, password]) => (
              <div
                className="credential-row"
                key={role}
                onClick={() => handleQuickDemoRole(role as "Admin" | "Teacher" | "Guardian")}
                style={{ cursor: "pointer", transition: "background 0.2s ease" }}
                title={`Launch 3D Portal as ${role}`}
              >
                <span className={`avatar ${role === "Admin" ? "avatar-a" : role === "Teacher" ? "avatar-t" : "avatar-g"}`}>
                  {role[0]}
                </span>
                <div>
                  <b>{role} <span style={{ fontSize: 10, color: "#52b788", fontWeight: "normal" }}>Launch ↗</span></b>
                  <small>{email}</small>
                </div>
                <code>{password}</code>
              </div>
            ))}
          </div>
        </section>
      </section>

      {loginOpen && (
        <LoginModal
          initialRole={targetRole}
          onClose={() => setLoginOpen(false)}
          onLogin={(next) => {
            setUser(next)
            setLoginOpen(false)
          }}
        />
      )}
    </main>
  )
}

function LoginModal({
  initialRole,
  onClose,
  onLogin,
}: {
  initialRole: "Admin" | "Teacher" | "Guardian"
  onClose: () => void
  onLogin: (user: User) => void
}) {
  const [email, setEmail] = useState(
    initialRole === "Teacher"
      ? "teacher@algions.edu"
      : initialRole === "Guardian"
      ? "guardian@algions.edu"
      : "admin@algions.edu"
  )
  const [password, setPassword] = useState(`${initialRole}@123`)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const loggedUser = await api.login(email, password)
      onLogin(loggedUser)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to sign in.")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFill = (role: "Admin" | "Teacher" | "Guardian") => {
    const account =
      role === "Admin"
        ? "admin@algions.edu"
        : role === "Teacher"
        ? "teacher@algions.edu"
        : "guardian@algions.edu"
    setEmail(account)
    setPassword(`${role}@123`)
    setError("")
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <div className="eyebrow">Welcome back</div>
        <h2>
          Sign in to your
          <br />
          <em>school workspace.</em>
        </h2>

        <form onSubmit={submit}>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="sage-button full" disabled={loading}>
            {loading ? "Authenticating…" : "Continue to 3D Portal →"}
          </button>
        </form>

        <div className="role-quickfill">
          <small>Quick fill account</small>
          <div>
            {(["Admin", "Teacher", "Guardian"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleQuickFill(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
