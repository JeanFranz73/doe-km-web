import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StatsClient from './StatsClient';

type StatsPageProps = {
  params: { id: string };
};

export default async function StatsPage({ params }: StatsPageProps) {
  const supabase = await createClient();

  // garante usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const campaignId = Number(params.id);

  // 1) Estatísticas por atleta
  const { data: athleteStats, error: athleteError } = await supabase
    .from('athlete_campaign_stats')
    .select('user_id, total_distance_m, total_value_brl')
    .eq('campaign_id', campaignId);

  if (athleteError) {
    console.error('Erro ao buscar athlete_campaign_stats:', athleteError);
  }

  const athletes = athleteStats ?? [];

  // 2) Atividades para montar evolução diária
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('started_at, distance_m')
    .eq('campaign_id', campaignId)
    .order('started_at', { ascending: true });

  if (activitiesError) {
    console.error('Erro ao buscar activities:', activitiesError);
  }

  const activitiesSafe = activities ?? [];

  // agrupa por dia (YYYY-MM-DD) e soma distância
  const dailyMap: Record<string, number> = {};

  for (const act of activitiesSafe) {
    if (!act.started_at) continue;
    const day = act.started_at.slice(0, 10); // '2025-12-03'
    dailyMap[day] = (dailyMap[day] || 0) + (act.distance_m || 0);
  }

  const daily = Object.entries(dailyMap).map(([day, dist]) => ({
    day,
    km: dist / 1000,
  }));

  // 3) Patrocinadores
  const { data: sponsorData, error: sponsorError } = await supabase
    .from('campaign_sponsors')
    .select(
      'company_id, tier, cap_brl, companies ( razap_social, logo_path )',
    )
    .eq('campaign_id', campaignId);

  if (sponsorError) {
    console.error('Erro ao buscar campaign_sponsors:', sponsorError);
  }

  const sponsors = sponsorData ?? [];

  // 4) ONGs
  const { data: ngosData, error: ngosError } = await supabase
    .from('campaign_ngos')
    .select('ngo_id, allocation_pct, ngos ( nome )')
    .eq('campaign_id', campaignId);

  if (ngosError) {
    console.error('Erro ao buscar campaign_ngos:', ngosError);
  }

  const ngos = ngosData ?? [];

  // 5) Monta summary a partir de athlete_campaign_stats
  let totalDistanceM = 0;
  let totalValueBrl = 0;

  for (const a of athletes) {
    totalDistanceM += a.total_distance_m || 0;
    totalValueBrl += Number(a.total_value_brl || 0);
  }

  const totalAthletes = athletes.length;
  const avgKmPerAthlete =
    totalAthletes > 0 ? (totalDistanceM / 1000) / totalAthletes : 0;

  const summary = {
    total_distance_m: totalDistanceM,
    total_value_brl: totalValueBrl,
    total_athletes: totalAthletes,
    avg_km_per_athlete: avgKmPerAthlete,
  };

  return (
    <main className="max-w-6xl mx-auto px-4 pb-10">
      <StatsClient
        summary={summary}
        athletes={athletes}
        daily={daily}
        sponsors={sponsors}
        ngos={ngos}
      />
    </main>
  );
}