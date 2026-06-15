import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
<div>
  <p className="brand">{user.username}</p>
  <p className="muted small">Welcome to RK Associates</p>
</div>

        <nav className="nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/workspace">Workspace</NavLink>
          {user.role === 'admin' && <NavLink to="/users">Users</NavLink>}
        </nav>
        <button className="secondary full" type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
