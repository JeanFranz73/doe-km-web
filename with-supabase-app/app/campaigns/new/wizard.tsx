'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  adminId: string; // id do admin (auth.users/admin_users)
};

type Step = 1 | 2 | 3 | 4;

type SponsorFormItem = {
  companyId: string;
  tier: string;
  capBrl: string;
  logoOrder: string;
};

type NgoFormItem = {
  ngoId: string;
  allocationPct: string;
};

export default function CampaignWizard({ adminId }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ======== TEXTOS DESCRITIVOS DAS ETAPAS ========
  const stepDescriptions: Record<Step, string> = {
    1: 'Nesta etapa você define as informações básicas da campanha: nome, período, meta financeira, valor base por quilômetro e, opcionalmente, a identidade visual.',
    2: 'Aqui você configura as regras de conversão de quilômetros em reais e alguns limites de plausibilidade para as atividades dos atletas.',
    3: 'Agora você vincula os patrocinadores à campanha, definindo cota, limite de valor e ordem de exibição dos logos.',
    4: 'Por fim, você escolhe as ONGs beneficiadas e define o percentual de alocação de cada uma, garantindo que a soma feche em 100%.',
  };

  // ======== FUNÇÃO CANCELAR ========
  function handleCancel() {
    router.push('/stats');
  }

  // ======== CAMPOS DA ETAPA 1 - campaigns ========
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodFinish, setPeriodFinish] = useState('');
  const [goalBrl, setGoalBrl] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [visualIdentityJson, setVisualIdentityJson] = useState('{}');

  async function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let visualIdentity: any = null;
    try {
      visualIdentity =
        visualIdentityJson.trim() === '' ? null : JSON.parse(visualIdentityJson);
    } catch (err) {
      setLoading(false);
      setErrorMsg('JSON de identidade visual inválido. Verifique a sintaxe.');
      return;
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        period_start: periodStart,
        period_finish: periodFinish,
        status: 'draft', // começa como rascunho
        goal_brl: goalBrl ? Number(goalBrl) : null,
        base_rate_brl_per_km: baseRate ? Number(baseRate) : 0,
        visual_identity: visualIdentity,
        created_by: adminId,
      })
      .select('id')
      .single();

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setCampaignId(data.id);
    setStep(2);
  }

  // ======== CAMPOS DA ETAPA 2 - campaign_rules ========
  const [ratePerKm, setRatePerKm] = useState('');
  const [maxPerAthlete, setMaxPerAthlete] = useState('');
  const [maxPerSponsor, setMaxPerSponsor] = useState('');
  const [rounding, setRounding] = useState<'nearest' | 'floor' | 'ceil'>('nearest');
  const [minDuration, setMinDuration] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [minPace, setMinPace] = useState('');
  const [exclusionsJson, setExclusionsJson] = useState('{}');

  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    if (!campaignId) return;

    setLoading(true);
    setErrorMsg(null);

    let exclusions: any = null;
    try {
      exclusions =
        exclusionsJson.trim() === '' ? null : JSON.parse(exclusionsJson);
    } catch (err) {
      setLoading(false);
      setErrorMsg('JSON de exclusões inválido. Verifique a sintaxe.');
      return;
    }

    const { error } = await supabase.from('campaign_rules').insert({
      campaign_id: campaignId,
      rate_brl_per_km: ratePerKm ? Number(ratePerKm) : null,
      max_brl_per_athlete: maxPerAthlete ? Number(maxPerAthlete) : null,
      max_brl_per_sponsor: maxPerSponsor ? Number(maxPerSponsor) : null,
      rounding,
      min_duration_s: minDuration ? Number(minDuration) : null,
      max_avg_speed_kmh: maxSpeed ? Number(maxSpeed) : null,
      min_pace_s_per_km: minPace ? Number(minPace) : null,
      exclusions,
      version: 1,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setStep(3);
  }

  // ======== ETAPA 3 - campaign_sponsors ========
  const [sponsors, setSponsors] = useState<SponsorFormItem[]>([
    { companyId: '', tier: '', capBrl: '', logoOrder: '1' },
  ]);

  function updateSponsor(idx: number, patch: Partial<SponsorFormItem>) {
    setSponsors((old) =>
      old.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }

  function addSponsorLine() {
    setSponsors((old) => [
      ...old,
      { companyId: '', tier: '', capBrl: '', logoOrder: String(old.length + 1) },
    ]);
  }

  async function handleStep3Submit(e: FormEvent) {
    e.preventDefault();
    if (!campaignId) return;

    setLoading(true);
    setErrorMsg(null);

    const records = sponsors
      .filter((s) => s.companyId)
      .map((s) => ({
        campaign_id: campaignId,
        company_id: Number(s.companyId),
        tier: s.tier || null,
        cap_brl: s.capBrl ? Number(s.capBrl) : null,
        logo_order: s.logoOrder ? Number(s.logoOrder) : null,
      }));

    if (records.length === 0) {
      setLoading(false);
      setStep(4);
      return;
    }

    const { error } = await supabase.from('campaign_sponsors').insert(records);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setStep(4);
  }

  // ======== ETAPA 4 - campaign_ngos ========
  const [ngos, setNgos] = useState<NgoFormItem[]>([
    { ngoId: '', allocationPct: '' },
  ]);

  function updateNgo(idx: number, patch: Partial<NgoFormItem>) {
    setNgos((old) =>
      old.map((n, i) => (i === idx ? { ...n, ...patch } : n)),
    );
  }

  function addNgoLine() {
    setNgos((old) => [...old, { ngoId: '', allocationPct: '' }]);
  }

  async function handleStep4Submit(e: FormEvent) {
    e.preventDefault();
    if (!campaignId) return;

    const totalPct = ngos.reduce(
      (sum, n) => sum + (n.allocationPct ? Number(n.allocationPct) : 0),
      0,
    );

    if (totalPct !== 100) {
      setErrorMsg(
        'A soma dos percentuais de alocação deve ser exatamente 100%.',
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const records = ngos
      .filter((n) => n.ngoId)
      .map((n) => ({
        campaign_id: campaignId,
        ngo_id: Number(n.ngoId),
        allocation_pct: Number(n.allocationPct),
      }));

    const { error } = await supabase.from('campaign_ngos').insert(records);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // terminou wizard → volta para listagem
    router.push('/campaigns');
  }

  // ======== BUSCA DE COMPANIES E NGOS PARA OS SELECTS ========
  const [companies, setCompanies] = useState<any[]>([]);
  const [ngosDb, setNgosDb] = useState<any[]>([]);

  // busca companies ao entrar no step 3
  useEffect(() => {
    if (step === 3) {
      supabase
        .from('companies')
        .select('id, razap_social')
        .order('razap_social', { ascending: true })
        .then(({ data }) => {
          if (data) setCompanies(data);
        });
    }
  }, [step, supabase]);

  // busca ONGs ao entrar no step 4
  useEffect(() => {
    if (step === 4) {
      supabase
        .from('ngos')
        .select('id, nome')
        .order('nome', { ascending: true })
        .then(({ data }) => {
          if (data) setNgosDb(data);
        });
    }
  }, [step, supabase]);

  // ======== RENDER ========

  return (
    <div className="space-y-4">
      {/* indicador simples de passo */}
      <div className="flex gap-2 text-sm">
        <span className={step === 1 ? 'font-bold' : ''}>1. Campanha</span>
        <span>›</span>
        <span className={step === 2 ? 'font-bold' : ''}>2. Regras</span>
        <span>›</span>
        <span className={step === 3 ? 'font-bold' : ''}>3. Patrocinadores</span>
        <span>›</span>
        <span className={step === 4 ? 'font-bold' : ''}>4. ONGs</span>
      </div>

      {/* descrição da etapa atual */}
      <p className="text-sm text-muted-foreground">
        {stepDescriptions[step]}
      </p>

      {errorMsg && (
        <div className="rounded-md border border-red-500 bg-red-900/40 px-3 py-2 text-sm">
          {errorMsg}
        </div>
      )}

      {/* ETAPA 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Nome da campanha *
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title="Nome que será exibido para atletas, patrocinadores e público em geral."
              >
                ?
              </span>
            </label>
            <input
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="DoeKM - Corrida Solidária de Inverno"
            />
            <p className="text-xs text-gray-400">
              Escolha um nome claro e fácil de reconhecer, pois ele aparecerá em telas públicas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Data inicial *
                <span
                  className="ml-1 text-xs text-gray-400 cursor-help"
                  title="Primeiro dia em que atividades passam a contar para esta campanha."
                >
                  ?
                </span>
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400">
                Atividades antes desta data não serão consideradas no cálculo da campanha.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Data final *
                <span
                  className="ml-1 text-xs text-gray-400 cursor-help"
                  title="Último dia em que atividades contam para esta campanha."
                >
                  ?
                </span>
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={periodFinish}
                onChange={(e) => setPeriodFinish(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400">
                Depois desta data, atividades continuam sendo registradas, mas não entram nesta campanha.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Meta em R$ (goal_brl)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title="Valor total desejado de doações somando todos os patrocinadores nesta campanha."
              >
                ?
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={goalBrl}
              onChange={(e) => setGoalBrl(e.target.value)}
              placeholder="5000"
            />
            <p className="text-xs text-gray-400">
              Serve como referência para comunicação e acompanhamento, não bloqueia o funcionamento da campanha.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Taxa base R$/km (base_rate_brl_per_km)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title="Valor inicial por quilômetro que será usado como base para a conversão em reais."
              >
                ?
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              placeholder="0.50"
            />
            <p className="text-xs text-gray-400">
              Esta taxa pode ser refinada depois nas regras da campanha, inclusive com limites por atleta ou patrocinador.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Identidade visual (JSON - opcional)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title='JSON com configurações visuais da campanha (cores, imagens, etc.). Exemplo: {"primaryColor":"#00ff88","bannerImage":"/caminho/para/imagem.png"}.'
              >
                ?
              </span>
            </label>
            <textarea
              rows={4}
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm font-mono outline-none focus:border-sky-500"
              value={visualIdentityJson}
              onChange={(e) => setVisualIdentityJson(e.target.value)}
              placeholder='{"primaryColor":"#00ff88","bannerImage":"/campaigns/1/banner.png"}'
            />
            <p className="text-xs text-gray-400">
              Use este campo para guardar configurações de layout, cores e imagens específicas desta campanha.
            </p>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-red-500 text-red-300 px-4 py-2 text-sm hover:bg-red-900/20"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Continuar para regras'}
            </button>
          </div>
        </form>
      )}

      {/* ETAPA 2 */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">
              R$/km efetivo (rate_brl_per_km)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title="Valor por quilômetro usado para calcular o total em reais da campanha, já considerando regras vigentes."
              >
                ?
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={ratePerKm}
              onChange={(e) => setRatePerKm(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Você pode deixar igual à taxa base ou definir um valor diferente conforme o acordo com patrocinadores.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Máx. por atleta (max_brl_per_athlete)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title="Teto de doação por atleta, para evitar que um único usuário concentre todo o valor da campanha."
              >
                ?
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={maxPerAthlete}
              onChange={(e) => setMaxPerAthlete(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Máx. por patrocinador (max_brl_per_sponsor)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title="Limite máximo de aporte por patrocinador nesta campanha."
              >
                ?
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={maxPerSponsor}
              onChange={(e) => setMaxPerSponsor(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Arredondamento (rounding)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title="Define como os valores serão arredondados: para o mais próximo, sempre para baixo ou sempre para cima."
              >
                ?
              </span>
            </label>
            <select
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={rounding}
              onChange={(e) => setRounding(e.target.value as any)}
            >
              <option value="nearest">Mais próximo</option>
              <option value="floor">Sempre para baixo</option>
              <option value="ceil">Sempre para cima</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Duração mínima (segundos)
                <span
                  className="ml-1 text-xs text-gray-400 cursor-help"
                  title="Tempo mínimo de atividade para ser considerada válida, em segundos."
                >
                  ?
                </span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Velocidade máx. (km/h)
                <span
                  className="ml-1 text-xs text-gray-400 cursor-help"
                  title="Velocidade média máxima aceitável; acima disso, a atividade pode ser sinalizada como suspeita."
                >
                  ?
                </span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Pace mínimo (seg/km)
                <span
                  className="ml-1 text-xs text-gray-400 cursor-help"
                  title="Pace mínimo (em segundos por quilômetro). Valores muito baixos indicam ritmo irreal."
                >
                  ?
                </span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={minPace}
                onChange={(e) => setMinPace(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Exclusões (JSON - opcional)
              <span
                className="ml-1 text-xs text-gray-400 cursor-help"
                title='JSON com regras específicas de exclusão (por exemplo: tipos de atividade, horários, etc.).'
              >
                ?
              </span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-sm font-mono outline-none focus:border-sky-500"
              value={exclusionsJson}
              onChange={(e) => setExclusionsJson(e.target.value)}
              placeholder='{"excludeSources":["manual"],"minDistanceM":500}'
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-gray-600 px-4 py-2 text-sm hover:border-gray-400"
            >
              Voltar
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-red-500 text-red-300 px-4 py-2 text-sm hover:bg-red-900/20"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Continuar para patrocinadores'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ETAPA 3 */}
      {step === 3 && (
        <form onSubmit={handleStep3Submit} className="space-y-4">
          {sponsors.map((s, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2 text-sm">
              {/* SELECT DE EMPRESAS */}
              <select
                className="rounded-md border border-gray-700 bg-black/40 px-2 py-1"
                value={s.companyId}
                onChange={(e) => updateSponsor(idx, { companyId: e.target.value })}
                required
              >
                <option value="">Selecione o patrocinador</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razap_social}
                  </option>
                ))}
              </select>

              <input
                className="rounded-md border border-gray-700 bg-black/40 px-2 py-1"
                placeholder="Cota (ex: Ouro)"
                title="Nível ou cota do patrocinador, por exemplo: Ouro, Prata, Bronze."
                value={s.tier}
                onChange={(e) => updateSponsor(idx, { tier: e.target.value })}
              />

              <input
                type="number"
                className="rounded-md border border-gray-700 bg-black/40 px-2 py-1"
                placeholder="Teto (R$)"
                title="Valor máximo que este patrocinador vai aportar nesta campanha."
                value={s.capBrl}
                onChange={(e) => updateSponsor(idx, { capBrl: e.target.value })}
              />

              <input
                type="number"
                className="rounded-md border border-gray-700 bg-black/40 px-2 py-1"
                placeholder="Ordem"
                title="Ordem em que o logo deste patrocinador aparece nos materiais da campanha."
                value={s.logoOrder}
                onChange={(e) => updateSponsor(idx, { logoOrder: e.target.value })}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addSponsorLine}
            className="text-xs underline"
          >
            + adicionar patrocinador
          </button>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md border border-gray-600 px-4 py-2 text-sm hover:border-gray-400"
            >
              Voltar
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-red-500 text-red-300 px-4 py-2 text-sm hover:bg-red-900/20"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Continuar para ONGs'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ETAPA 4 */}
      {step === 4 && (
        <form onSubmit={handleStep4Submit} className="space-y-4">
          {ngos.map((n, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 text-sm">
              {/* SELECT DE ONGs */}
              <select
                className="rounded-md border border-gray-700 bg-black/40 px-2 py-1"
                value={n.ngoId}
                onChange={(e) => updateNgo(idx, { ngoId: e.target.value })}
                required
              >
                <option value="">Selecione a ONG</option>
                {ngosDb.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>

              <input
                type="number"
                className="rounded-md border border-gray-700 bg-black/40 px-2 py-1"
                placeholder="% alocação"
                title="Percentual do valor arrecadado que será destinado a esta ONG."
                value={n.allocationPct}
                onChange={(e) =>
                  updateNgo(idx, { allocationPct: e.target.value })
                }
                required
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addNgoLine}
            className="text-xs underline"
          >
            + adicionar ONG
          </button>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-md border border-gray-600 px-4 py-2 text-sm hover:border-gray-400"
            >
              Voltar
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-red-500 text-red-300 px-4 py-2 text-sm hover:bg-red-900/20"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Finalizar campanha'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
