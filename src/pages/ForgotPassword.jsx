import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';

function getErrorMessage(apiError, fallback) {
  const validationMessage = apiError.response?.data?.errors?.[0]?.message;
  return validationMessage || apiError.response?.data?.message || fallback;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);

  async function handleRequestOtp(event) {
    event.preventDefault();
    setError('');
    setRequesting(true);

    try {
      const resetUsername = username.trim();
      await requestPasswordReset(resetUsername);
      sessionStorage.setItem('passwordResetUsername', resetUsername);
      navigate('/reset-password', {
        replace: true,
        state: { message: 'OTP sent successfully.' }
      });
    } catch (apiError) {
      setError(getErrorMessage(apiError, 'Unable to send OTP'));
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="login-panel reset-panel">
        <div className="login-copy">
          <p className="eyebrow">Account Recovery</p>
          <h1>Reset your password</h1>
          <p className="muted">Enter your username to send a 6-digit OTP to the admin email.</p>
          <Link className="auth-back-link" to="/login">
            Back to sign in
          </Link>
        </div>

        <div className="reset-stack">
          <form className="form-card" onSubmit={handleRequestOtp}>
            <h2>Request OTP</h2>
            <label>
              Username
              <input
                autoComplete="username"
                name="username"
                onChange={(event) => setUsername(event.target.value)}
                required
                type="text"
                value={username}
              />
            </label>

            <button disabled={requesting} type="submit">
              {requesting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          {error && <div className="alert error">{error}</div>}
        </div>
      </section>
    </div>
  );
}
