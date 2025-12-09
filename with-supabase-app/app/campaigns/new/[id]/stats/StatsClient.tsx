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

type Props = {
  summary: any;
  athletes: any[];
  daily: any[];
  sponsors: any[];
  ngos: any[];
};

export default function StatsClient({
  summary,
  athletes,
  daily,
  sponsors,
  ngos,
}: Props) {
  return (
    <div className="space-y-10 py-8">

      {/* TÍTULO */}
      <div>
        <h1 className="text-3xl font-bold">Estatísticas da Campanha</h1>
        <p className="text-sm text-gray-400 mt-1">
          Acompanhe o desempenho geral, evolução diária, atletas, patrocinadores e ONGs.
        </p>
      </div>

      {/* CARDS RESUMO */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="p-4 border rounded-md bg-black/20">
            <div className="text-sm text-gray-400">Total arrecadado</div>
            <div className="text-2xl font-bold">
              R$ {summary.total_value_brl?.toFixed(2) || '0,00'}
            </div>
          </div>

          <div className="p-4 border rounded-md bg-black/20">
            <div className="text-sm text-gray-400">Total percorrido</div>
            <div className="text-2xl font-bold">
              {(summary.total_distance_m / 1000).toFixed(1)} km
            </div>
          </div>

          <div className="p-4 border rounded-md bg-black/20">
            <div className="text-sm text-gray-400">Participantes</div>
            <div className="text-2xl font-bold">{summary.total_athletes}</div>
          </div>

          <div className="p-4 border rounded-md bg-black/20">
            <div className="text-sm text-gray-400">Média por atleta</div>
            <div className="text-2xl font-bold">
              {summary.avg_km_per_athlete?.toFixed(1)} km
            </div>
          </div>

        </div>
      )}

      {/* GRÁFICO DE KM DIÁRIOS */}
      <div className="p-6 border rounded-md bg-black/20">
        <h2 className="text-xl font-bold mb-4">Evolução diária dos quilômetros</h2>

        {daily?.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum dado diário encontrado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
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
      </div>

      {/* TOP ATLETAS */}
      <div className="p-6 border rounded-md bg-black/20">
        <h2 className="text-xl font-bold mb-4">Atletas que mais contribuíram</h2>

        {athletes?.length === 0 ? (
          <p className="text-sm text-gray-400">Ainda não há atletas com atividades.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-700/50">
                <th className="py-2">Atleta</th>
                <th>Distância (km)</th>
                <th>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((a, i) => (
                <tr key={i} className="border-b border-gray-700/30">
                  <td className="py-2">{a.user_id}</td>
                  <td>{(a.total_distance_m / 1000).toFixed(1)}</td>
                  <td>{Number(a.total_value_brl).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PATROCINADORES */}
      <div className="p-6 border rounded-md bg-black/20">
        <h2 className="text-xl font-bold mb-4">Patrocinadores</h2>

        {sponsors?.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum patrocinador vinculado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="py-2">Empresa</th>
                <th>Cota</th>
                <th>Teto (R$)</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s, i) => (
                <tr key={i} className="border-b border-gray-700/30">
                  <td className="py-2">{s.companies?.razap_social || '—'}</td>
                  <td>{s.tier || '—'}</td>
                  <td>{s.cap_brl ? Number(s.cap_brl).toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ONGs */}
      <div className="p-6 border rounded-md bg-black/20">
        <h2 className="text-xl font-bold mb-4">ONGs beneficiadas</h2>

        {ngos?.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma ONG vinculada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="py-2">ONG</th>
                <th>Alocação (%)</th>
              </tr>
            </thead>
            <tbody>
              {ngos.map((n, i) => (
                <tr key={i} className="border-b border-gray-700/30">
                  <td className="py-2">{n.ngos?.nome || '—'}</td>
                  <td>{n.allocation_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}