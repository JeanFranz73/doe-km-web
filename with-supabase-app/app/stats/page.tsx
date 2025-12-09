import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GlobalStatsClient from './GlobalStatsClient';

export default async function GlobalStatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // 1) Estatísticas por atleta em todas as campanhas
  const { data: athleteStats, error: athleteError } = await supabase
    .from('athlete_campaign_stats')
    .select('user_id, total_distance_m, total_value_brl');

  if (athleteError) {
    console.error('Erro ao buscar athlete_campaign_stats:', athleteError);
  }

  const stats = athleteStats ?? [];

  const perUser: Record<
    string,
    { user_id: string; total_distance_m: number; total_value_brl: number }
  > = {};

  for (const row of stats) {
    const id = row.user_id;
    if (!perUser[id]) {
      perUser[id] = {
        user_id: id,
        total_distance_m: 0,
        total_value_brl: 0,
      };
    }
    perUser[id].total_distance_m += row.total_distance_m || 0;
    perUser[id].total_value_brl += Number(row.total_value_brl || 0);
  }

  const aggregatedAthletes = Object.values(perUser);

  const topAthletes = [...aggregatedAthletes]
    .sort((a, b) => b.total_value_brl - a.total_value_brl)
    .slice(0, 10);

  // 2) Atividades para evolução diária global
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('started_at, distance_m')
    .order('started_at', { ascending: true });

  if (activitiesError) {
    console.error('Erro ao buscar activities:', activitiesError);
  }

  const activitiesSafe = activities ?? [];

  const dailyMap: Record<string, number> = {};

  for (const act of activitiesSafe) {
    if (!act.started_at) continue;
    const day = act.started_at.slice(0, 10); // "YYYY-MM-DD"
    dailyMap[day] = (dailyMap[day] || 0) + (act.distance_m || 0);
  }

  const daily = Object.entries(dailyMap).map(([day, dist]) => ({
    day,
    km: dist / 1000,
  }));

  // 3) Summary global
  let totalDistanceM = 0;
  let totalValueBrl = 0;

  for (const a of aggregatedAthletes) {
    totalDistanceM += a.total_distance_m;
    totalValueBrl += a.total_value_brl;
  }

  const totalAthletes = aggregatedAthletes.length;
  const avgKmPerAthlete =
    totalAthletes > 0 ? (totalDistanceM / 1000) / totalAthletes : 0;

  const summary = {
    total_distance_m: totalDistanceM,
    total_value_brl: totalValueBrl,
    total_athletes: totalAthletes,
    avg_km_per_athlete: avgKmPerAthlete,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <GlobalStatsClient
        summary={summary}
        daily={daily}
        topAthletes={topAthletes}
        userEmail={user.email}
      />
    </div>
  );
}