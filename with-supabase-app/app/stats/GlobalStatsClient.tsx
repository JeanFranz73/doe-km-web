'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Summary = {
  total_distance_m: number;
  total_value_brl: number;
  total_athletes: number;
  avg_km_per_athlete: number;
};

type DailyPoint = {
  day: string;
  km: number;
};

type Athlete = {
  user_id: string;
  total_distance_m: number;
  total_value_brl: number;
};

type Props = {
  summary: Summary;
  daily: DailyPoint[];
  topAthletes: Athlete[];
  userEmail?: string | null;
};

export default function GlobalStatsClient({
  summary,
  daily,
  topAthletes,
  userEmail,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <>
      {/* NAVBAR ESTILO STARTER */}
      <header className="border-b border-gray-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              Next.js Supabase Starter
            </span>

            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-black px-3 py-1 text-xs font-medium hover:border-gray-500"
            >
              <span>▲</span>
              <span>Deploy to Vercel</span>
            </a>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-300">
            {userEmail && <span>Hey, {userEmail}!</span>}
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-black hover:bg-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 space-y-10">
        {/* AÇÕES PRINCIPAIS */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Estatísticas gerais</h1>
            <p className="mt-1 text-sm text-gray-400">
              Visão agregada de todas as campanhas do DoeKM: distância percorrida,
              valor convertido e engajamento dos atletas.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/campaigns/new"
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500"
            >
              Cadastrar campanha
            </Link>

            <Link
              href="/campaigns"
              className="rounded-md border border-gray-600 px-4 py-2 text-sm font-semibold hover:border-sky-500"
            >
              Estatísticas por campanha
            </Link>
          </div>
        </section>

        {/* CARDS RESUMO */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-gray-800 bg-black/40 p-4">
            <div className="text-sm text-gray-400">Total arrecadado</div>
            <div className="text-2xl font-bold">
              R$ {summary.total_value_brl.toFixed(2)}
            </div>
          </div>

          <div className="rounded-md border border-gray-800 bg-black/40 p-4">
            <div className="text-sm text-gray-400">Total percorrido</div>
            <div className="text-2xl font-bold">
              {(summary.total_distance_m / 1000).toFixed(1)} km
            </div>
          </div>

          <div className="rounded-md border border-gray-800 bg-black/40 p-4">
            <div className="text-sm text-gray-400">Atletas únicos</div>
            <div className="text-2xl font-bold">
              {summary.total_athletes}
            </div>
          </div>

          <div className="rounded-md border border-gray-800 bg-black/40 p-4">
            <div className="text-sm text-gray-400">Média por atleta</div>
            <div className="text-2xl font-bold">
              {summary.avg_km_per_athlete.toFixed(1)} km
            </div>
          </div>
        </section>

        {/* GRÁFICO DIÁRIO GLOBAL */}
        <section className="rounded-md border border-gray-800 bg-black/40 p-6">
          <h2 className="mb-4 text-xl font-bold">
            Evolução diária (todas as campanhas)
          </h2>

          {daily.length === 0 ? (
            <p className="text-sm text-gray-400">
              Ainda não há atividades registradas para gerar a série diária.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="km"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* TOP ATLETAS GLOBAIS */}
        <section className="rounded-md border border-gray-800 bg-black/40 p-6">
          <h2 className="mb-4 text-xl font-bold">
            Atletas que mais contribuíram (geral)
          </h2>

          {topAthletes.length === 0 ? (
            <p className="text-sm text-gray-400">
              Ainda não há atletas com dados suficientes para ranking.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left">
                  <th className="py-2">Atleta (user_id)</th>
                  <th>Distância (km)</th>
                  <th>Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {topAthletes.map((a) => (
                  <tr
                    key={a.user_id}
                    className="border-b border-gray-700/30"
                  >
                    <td className="py-2">{a.user_id}</td>
                    <td>{(a.total_distance_m / 1000).toFixed(1)}</td>
                    <td>{a.total_value_brl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  );
}
