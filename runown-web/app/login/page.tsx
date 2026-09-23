import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { loginAction } from '@/app/actions/auth';
import { getSession } from '@/lib/session';

export const metadata = { title: 'Log in — RunOwn' };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/');

  return <AuthForm mode="login" action={loginAction} />;
}
