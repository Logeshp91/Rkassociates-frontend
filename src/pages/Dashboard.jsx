import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome, {user.username}</h1>
        </div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span>Username</span>
          <strong>{user.username}</strong>
        </article>
        <article className="stat-card">
          <span>Role</span>
          <strong className="capitalize">{user.role}</strong>
        </article>
        <article className="stat-card">
          <span>Created</span>
          <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
        </article>
      </div>

      {user.role === 'admin' && (
        <div className="action-strip">
          <p>Admin controls are available for this account.</p>
          <Link className="button-link" to="/users">
            Manage Users
          </Link>
        </div>
      )}
    </section>
  );
}
