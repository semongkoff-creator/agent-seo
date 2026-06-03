import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/session';

export default async function HomePage() {
  const user = await getUser();
  redirect(user ? '/dashboard' : '/login');
}
