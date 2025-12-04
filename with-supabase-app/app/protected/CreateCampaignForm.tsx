'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  userId: string;
};

export default function CreateCampaignForm({ userId }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState('');
  const [goalBrl, setGoalBrl] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodFinish, setPeriodFinish] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // ajusta aqui de acordo com o teu schema de campaigns
    const { error } = await supabase.from('campaigns').insert({
      name,
      period_start: periodStart,
      period_finish: periodFinish,
      goal_brl: goalBrl ? Number(goalBrl) : null,
      created_by: userId,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Depois você pode mandar para /campaigns ou detalhes da campanha
    router.push('/protected');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="rounded-md border border-red-500 bg-red-900/40 px-3 py-2 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium">Nome da campanha *</label>
        <input
          className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="DoeKM - Corrida Solidária de Verão"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Data inicial *</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Data final *</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
            value={periodFinish}
            onChange={(e) => setPeriodFinish(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Meta em R$ (opcional)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
          value={goalBrl}
          onChange={(e) => setGoalBrl(e.target.value)}
          placeholder="5000"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {loading ? 'Salvando...' : 'Criar campanha'}
      </button>
    </form>
  );
}