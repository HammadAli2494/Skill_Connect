import { useState } from 'react';

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  loading = false,
  disabled,
  ...props
}) {
  const styles = {
    primary: 'bg-forest text-white hover:bg-forest-dark',
    secondary: 'bg-card text-ink border border-line hover:bg-paper',
    ghost: 'bg-transparent text-ink hover:bg-white',
    danger: 'bg-card text-danger border border-danger/30 hover:bg-red-50',
  };
  const inactive = disabled || loading;
  return (
    <button
      type={type}
      disabled={inactive}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

const control =
  'h-11 w-full rounded-md border border-line bg-card px-3 text-sm text-ink placeholder:text-stone-400 focus-visible:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:bg-paper';

export function Input({ className = '', ...props }) {
  return <input className={`${control} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus-visible:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${control} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-16" />
      <button
        type="button"
        className="absolute top-1/2 right-2 -translate-y-1/2 text-xs font-semibold text-forest"
        onClick={() => setShow((value) => !value)}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
