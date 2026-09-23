'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import type { FormState } from '@/app/actions/auth';

type Props = {
  mode: 'login' | 'signup';
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

const initialState: FormState = { error: null };

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignup = mode === 'signup';

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <p className="font-mono text-xs font-bold tracking-wide text-ember uppercase">
        {isSignup ? 'Join the map' : 'Welcome back'}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-wide">
        {isSignup ? 'Create your account' : 'Log in'}
      </h1>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        {isSignup && (
          <Field id="name" name="name" label="Name" type="text" autoComplete="name" />
        )}
        <Field id="email" name="email" label="Email" type="email" autoComplete="email" />
        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
        />

        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm text-ember"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-ember px-5 py-2.5 text-center font-mono text-sm font-bold tracking-wide text-ember-ink uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-dim">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-ember hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" className="text-ember hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="font-mono text-xs font-bold tracking-wide text-dim uppercase">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-foreground outline-none transition-colors focus:border-ember"
      />
    </label>
  );
}
