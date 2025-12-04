import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CampaignsListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Busca todas as campanhas
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, name, period_start, period_finish, status, goal_brl')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar campanhas:', error);
  }

  const campaignsList = campaigns ?? [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <header className="border-b border-gray-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/stats" className="text-sm font-semibold hover:text-sky-400">
            ← Voltar para estatísticas gerais
          </Link>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="mt-1 text-sm text-gray-400">
              Selecione uma campanha para ver suas estatísticas detalhadas
            </p>
          </div>

          <Link
            href="/campaigns/new"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500"
          >
            + Nova campanha
          </Link>
        </div>

        {campaignsList.length === 0 ? (
          <div className="rounded-md border border-gray-800 bg-black/40 p-8 text-center">
            <p className="text-gray-400">
              Ainda não há campanhas cadastradas.
            </p>
            <Link
              href="/campaigns/new"
              className="mt-4 inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500"
            >
              Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaignsList.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/new/${campaign.id}/stats`}
                className="rounded-md border border-gray-800 bg-black/40 p-5 hover:border-sky-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{campaign.name}</h3>
                  <span
                    className={`text-xs rounded-full px-2 py-1 ${
                      campaign.status === 'active'
                        ? 'bg-green-900/40 text-green-300'
                        : campaign.status === 'draft'
                        ? 'bg-yellow-900/40 text-yellow-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-400">
                  <div>
                    <span className="font-medium">Início:</span>{' '}
                    {new Date(campaign.period_start).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-medium">Fim:</span>{' '}
                    {new Date(campaign.period_finish).toLocaleDateString('pt-BR')}
                  </div>
                  {campaign.goal_brl && (
                    <div>
                      <span className="font-medium">Meta:</span> R${' '}
                      {Number(campaign.goal_brl).toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="mt-4 text-sm text-sky-400 font-medium">
                  Ver estatísticas →
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
