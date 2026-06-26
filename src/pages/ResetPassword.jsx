import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';

const initialForm = {
  otp: '',
  password: '',
  confirmPassword: ''
};

function getErrorMessage(apiError, fallback) {
  const validationMessage = apiError.response?.data?.errors?.[0]?.message;
  return validationMessage || apiError.response?.data?.message || fallback;
}

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('passwordResetUsername')) {
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate]);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const username = sessionStorage.getItem('passwordResetUsername');

      await resetPassword({
        username,
        otp: form.otp.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword
      });

      sessionStorage.removeItem('passwordResetUsername');
      setForm(initialForm);
      setMessage('Password reset successfully.');
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (apiError) {
      setError(getErrorMessage(apiError, 'Unable to reset password'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="login-panel reset-panel">
        <div className="login-copy">
          <p className="eyebrow">Account Recovery</p>
          <h1>Reset your password</h1>
          <p className="muted">Enter the OTP from the admin inbox and choose a new password.</p>
          <Link className="auth-back-link" to="/forgot-password">
            Back
          </Link>
        </div>

        <div className="reset-stack">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Reset Password</h2>
            <label>
              OTP
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                name="otp"
                onChange={handleChange}
                pattern="\d{6}"
                required
                type="text"
                value={form.otp}
              />
            </label>

            <label>
              New Password
              <input
                autoComplete="new-password"
                name="password"
                onChange={handleChange}
                required
                type="password"
                value={form.password}
              />
            </label>

            <label>
              Confirm Password
              <input
                autoComplete="new-password"
                name="confirmPassword"
                onChange={handleChange}
                required
                type="password"
                value={form.confirmPassword}
              />
            </label>

            <button disabled={submitting} type="submit">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>

            {message && <div className="alert success">{message}</div>}
          </form>

          {error && <div className="alert error">{error}</div>}
        </div>
      </section>
    </div>
  );
}
