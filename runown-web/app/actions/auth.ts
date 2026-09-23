'use server';

import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { setSession, clearSession, getSession } from '@/lib/session';

export type FormState = { error: string | null };

export async function signupAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name || !email || !password) {
    return { error: 'Fill in your name, email, and password.' };
  }

  const result = await api.signup(name, email, password);
  if (!result.ok) return { error: result.error };

  await setSession({ token: result.token, name: result.user.name });
  redirect('/');
}

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Enter your email and password.' };
  }

  const result = await api.login(email, password);
  if (!result.ok) return { error: result.error };

  await setSession({ token: result.token, name: result.user.name });
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) await api.logout(session.token);
  await clearSession();
  redirect('/');
}
