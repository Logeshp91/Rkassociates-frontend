import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(form.username.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to log in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="login-panel">
        <div className="login-copy">
          <p className="eyebrow">Secure Access</p>
          <h1>RK Associates Management Portal</h1>
          <p className="muted">Welcome back. Sign in to access your dashboard.</p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              name="username"
              onChange={handleChange}
              required
              type="text"
              value={form.username}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
          </label>

          <Link className="inline-link" to="/forgot-password">
            Forgot password?
          </Link>

          {error && <div className="alert error">{error}</div>}

          <button disabled={submitting} type="submit">
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </div>
  );
}
