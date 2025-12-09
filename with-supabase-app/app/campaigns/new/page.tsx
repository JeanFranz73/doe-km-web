import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CampaignWizard from './wizard';

export default async function NewCampaignPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // aqui assumo que esse user.id também existe em admin_users.id
  // (aquele insert que comentamos antes)
  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Nova campanha</h1>
      <p className="text-sm text-muted-foreground">
        Vamos cadastrar os dados da campanha em etapas: dados básicos, regras, patrocinadores e ONGs.
      </p>

      <CampaignWizard adminId={user.id} />
    </main>
  );
}