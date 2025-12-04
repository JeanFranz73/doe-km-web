import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CreateCampaignForm from './CreateCampaignForm';

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Criar nova campanha</h1>
      <p className="text-sm text-muted-foreground">
        Preencha os dados da campanha para começar a converter quilômetros em doações.
      </p>

      <CreateCampaignForm userId={user.id} />
    </main>
  );
}