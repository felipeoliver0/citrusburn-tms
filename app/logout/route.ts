import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function POST() {
  const cookieStore = await cookies();
  
  // Apaga o cookie real de autenticação
  cookieStore.delete('auth_token');
  
  // Joga ele de volta para o login de forma limpa
  redirect('/login');
}
