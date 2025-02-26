
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import ResetPassword from '../../../components/Auth/ResetPassword';

export default async function ResetPasswordPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();

  if (data?.session) {
    redirect('auth/sign-in'); 
  }

  return <ResetPassword />;
}