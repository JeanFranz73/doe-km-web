// app/protected/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import CreateCampaignForm from './CreateCampaignForm';

export default async function ProtectedPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // se não estiver autenticado, manda pro login
  if (!user) {
    redirect('/login');
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">Criar nova campanha</h1>
      <p className="text-sm text-gray-400 mb-6">
        Defina nome, ONG e meta em quilômetros. Depois vamos ligar isso às atividades.
      </p>

      <CreateCampaignForm userId={user.id} />
    </main>
  );
}