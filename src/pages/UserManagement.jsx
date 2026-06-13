import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const initialForm = {
  username: '',
  password: '',
  role: 'user'
};

function getResponseData(response) {
  return response.data?.data || response.data || {};
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const mainAdminUsername = useMemo(() => import.meta.env.VITE_MAIN_ADMIN_USERNAME || 'admin', []);

  async function loadUsers() {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/users');
      setUsers(getResponseData(response).users || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await api.post('/users', {
        username: form.username.trim(),
        password: form.password,
        role: form.role
      });
      setForm(initialForm);
      setMessage('User created successfully');
      await loadUsers();
    } catch (apiError) {
      const validationMessage = apiError.response?.data?.errors?.[0]?.message;
      setError(validationMessage || apiError.response?.data?.message || 'Unable to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId) {
    setError('');
    setMessage('');

    try {
      await api.delete(`/users/${userId}`);
      setUsers((current) => current.filter((user) => user._id !== userId));
      setMessage('User deleted successfully');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to delete user');
    }
  }

  return (
    <section className="page">
      <div className="page-header split">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>User Management</h1>
        </div>
      </div>

      <div className="management-grid">
        <form className="form-card compact" onSubmit={handleSubmit}>
          <h2>Create User</h2>

          <label>
            Username
            <input
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
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
          </label>

          <label>
            Role
            <select name="role" onChange={handleChange} value={form.role}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button disabled={submitting} type="submit">
            {submitting ? 'Creating...' : 'Create User'}
          </button>
        </form>

        <div className="users-panel">
          <div className="panel-top">
            <h2>All Users</h2>
            <button className="secondary" type="button" onClick={loadUsers}>
              Refresh
            </button>
          </div>

          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}

          {loading ? (
            <p className="muted">Loading users...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td className="capitalize">{user.role}</td>
                      <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td>
                        <button
                          className="danger"
                          disabled={user.username === mainAdminUsername}
                          type="button"
                          onClick={() => handleDelete(user._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
