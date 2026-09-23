import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { signupAction } from '@/app/actions/auth';
import { getSession } from '@/lib/session';

export const metadata = { title: 'Sign up — RunOwn' };

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect('/');

  return <AuthForm mode="signup" action={signupAction} />;
}
