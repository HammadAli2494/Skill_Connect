import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Field, Input, PasswordInput } from '../../components/common/Fields';
import { useAuth } from '../../context/AuthContext';
import api, { getErrorMessage } from '../../services/api';
import { dashboardPath } from '../../utils/roleHome';
import { usePageMeta } from '../../utils/seo';

function AuthShell({ title, children, footer }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-3xl">{title}</h1>
      <div className="mt-6 border border-line bg-card p-5">{children}</div>
      {footer ? <div className="mt-4 text-sm text-muted">{footer}</div> : null}
    </div>
  );
}

export function LoginPage() {
  usePageMeta({ title: 'Log in', description: 'Log in to your Skill Connect account.', path: '/login' });
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        email: data.get('email'),
        password: data.get('password'),
      });
      const user = res.data.data.user;
      const destination = dashboardPath(user.role, params.get('next'));
      if (!destination) {
        await api.post('/auth/logout').catch(() => {});
        setUser(null);
        setError('This account does not have a recognized role.');
        return;
      }
      setUser(user);
      navigate(destination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Log in" footer={<Link to="/forgot-password" className="text-forest">Forgot password?</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
        <Field label="Password"><PasswordInput name="password" required autoComplete="current-password" /></Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" loading={loading} className="w-full">Log in</Button>
      </form>
      <p className="mt-4 text-sm">
        New here? <Link to="/register" className="font-semibold text-forest">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  usePageMeta({
    title: 'Create an account',
    description: 'Create a customer or provider account on Skill Connect.',
    path: '/register',
  });
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [nextPath, setNextPath] = useState('/services');
  const [loading, setLoading] = useState(false);
  const defaultRole = params.get('role') === 'provider' ? 'provider' : 'customer';

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        name: data.get('name'),
        email: data.get('email'),
        password: data.get('password'),
        phone: data.get('phone'),
        role: data.get('role'),
      });
      setUser(res.data.data.user);
      const next = data.get('role') === 'provider' ? '/provider' : '/bookings';
      if (res.data.data.emailNotice) {
        setNotice(res.data.data.emailNotice);
        setNextPath(next);
        setError('');
        return;
      }
      navigate(next);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={defaultRole === 'provider' ? 'Offer a service' : 'Create an account'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><Input name="name" required minLength={2} /></Field>
        <Field label="Email"><Input name="email" type="email" required /></Field>
        <Field label="Phone"><Input name="phone" placeholder="03XXXXXXXXX" /></Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number.">
          <PasswordInput name="password" required minLength={8} />
        </Field>
        <Field label="I am joining as">
          <select name="role" defaultValue={defaultRole} className="h-11 w-full rounded-md border border-line bg-card px-3 text-sm">
            <option value="customer">Customer</option>
            <option value="provider">Service provider</option>
          </select>
        </Field>
        {notice ? <p className="text-sm text-ink">{notice}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {notice ? (
          <Button type="button" className="w-full" onClick={() => navigate(nextPath)}>
            Continue
          </Button>
        ) : (
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        )}
      </form>
      <p className="mt-4 text-sm">
        Already registered? <Link to="/login" className="font-semibold text-forest">Log in</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: new FormData(event.currentTarget).get('email') });
      setMessage(res.data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset your password">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><Input name="email" type="email" required /></Field>
        {message ? <p className="text-sm text-forest">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" loading={loading}>Send reset link</Button>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        token: params.get('token'),
        password: new FormData(event.currentTarget).get('password'),
      });
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password"><PasswordInput name="password" required minLength={8} /></Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" loading={loading}>Update password</Button>
      </form>
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { setUser } = useAuth();
  const [message, setMessage] = useState('Confirming your email…');
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('This verification link is missing.');
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        setUser(res.data.data.user);
        setMessage('Your email is verified.');
      })
      .catch((err) => setMessage(getErrorMessage(err)));
  }, [token, setUser]);

  return (
    <AuthShell title="Email verification">
      <p className="text-sm">{message}</p>
      <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-forest">
        Continue
      </Link>
    </AuthShell>
  );
}
