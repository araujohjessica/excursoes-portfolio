import { useEffect, useState } from 'react';
import type { AsaasFees, FinanceSummary } from '../../types';
import { adminCommsApi } from '../../services/customerApi';

const PIX_DISCOUNT = 0.05;
const brl = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const pct = (v: number | null | undefined) => (v == null ? '—' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`);
const date = (d: string | null) => (d ? new Date(d.replace(' ', 'T')).toLocaleDateString('pt-BR') : '');

function estimate(fees: AsaasFees, method: 'pix' | 'credit', value: number, installments: number) {
  if (method === 'pix') {
    if (fees.pix.type === 'PERCENTAGE' && fees.pix.percentageFee != null) {
      let f = (value * fees.pix.percentageFee) / 100;
      if (fees.pix.minimumFee != null) f = Math.max(f, fees.pix.minimumFee);
      if (fees.pix.maximumFee != null) f = Math.min(f, fees.pix.maximumFee);
      return f;
    }
    return fees.pix.fee;
  }
  const t = fees.creditCard.tiers.find(x => installments >= x.minInstallments && installments <= x.maxInstallments) || fees.creditCard.tiers[fees.creditCard.tiers.length - 1];
  return (value * t.percentage) / 100 + fees.creditCard.operationFee;
}

/** Quanto sobra para você de um pacote com preço `price`. */
function netFor(fees: AsaasFees, price: number, method: 'pix' | 'credit', installments: number) {
  const pays = method === 'pix' ? price * (1 - PIX_DISCOUNT) : price;
  return pays - estimate(fees, method, pays, installments);
}

/** Menor preço de pacote (em centavos inteiros) para receber pelo menos `target`. */
function priceFor(fees: AsaasFees, target: number, method: 'pix' | 'credit', installments: number) {
  if (target <= 0) return 0;
  let lo = 0, hi = Math.max(10, target * 2);
  while (netFor(fees, hi, method, installments) < target) hi *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (netFor(fees, mid, method, installments) >= target) hi = mid;
    else lo = mid;
  }
  let cents = Math.ceil(hi * 100 - 1e-6);
  while (netFor(fees, cents / 100, method, installments) < target - 1e-9) cents++;
  return cents / 100;
}

const card = 'bg-card border border-foreground/10 rounded-2xl p-6';
const h2 = "font-['Outfit'] font-bold text-lg text-foreground mb-1";

export default function AdminFinanceiro() {
  const [fees, setFees] = useState<AsaasFees | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [simValue, setSimValue] = useState(350);
  const [simMethod, setSimMethod] = useState<'pix' | 'credit'>('pix');
  const [simInstallments, setSimInstallments] = useState(1);
  const [simMode, setSimMode] = useState<'price' | 'target'>('price');
  const [target, setTarget] = useState(300);

  const load = async (refresh = false) => {
    setRefreshing(true);
    setError('');
    try {
      const [f, s] = await Promise.all([adminCommsApi.fees(refresh), adminCommsApi.financeSummary()]);
      setFees(f);
      setSummary(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!fees) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        {error ? <p className="text-red-400 text-sm">{error}</p> : <div className="w-8 h-8 rounded-full border-4 border-foreground/10 border-t-[#F97316] animate-spin" />}
      </div>
    );
  }

  // Simulação: valor do pacote → o que o cliente paga → taxa → o que você recebe
  const customerPays = simMethod === 'pix' ? simValue * (1 - PIX_DISCOUNT) : simValue;
  const simFee = estimate(fees, simMethod, customerPays, simInstallments);
  const youReceive = customerPays - simFee;
  const effective = simValue ? ((simValue - youReceive) / simValue) * 100 : 0;
  const receiveText = simMethod === 'pix'
    ? 'Na hora (cai no saldo assim que o Pix é pago)'
    : simInstallments > 1
      ? `Cada parcela ~${fees.creditCard.daysToReceive} dias após o vencimento dela (a última em ~${simInstallments} meses)`
      : `~${fees.creditCard.daysToReceive} dias após a aprovação`;

  // Modo "quero receber": preço necessário por forma de pagamento
  const targetRows = [
    { label: 'Pix (−5%)', method: 'pix' as const, installments: 1 },
    ...Array.from({ length: 12 }, (_, i) => ({ label: `Cartão ${i + 1}x`, method: 'credit' as const, installments: i + 1 })),
  ].map(r => {
    const price = priceFor(fees, target, r.method, r.installments);
    const pays = r.method === 'pix' ? price * (1 - PIX_DISCOUNT) : price;
    return { ...r, price, pays, fee: estimate(fees, r.method, pays, r.installments), net: netFor(fees, price, r.method, r.installments) };
  });
  const recommended = targetRows.reduce((max, r) => (r.price > max.price ? r : max), targetRows[0]);
  const cheapest = targetRows.reduce((min, r) => (r.price < min.price ? r : min), targetRows[0]);

  const methodLabel: Record<string, string> = { pix: 'Pix', credit: 'Cartão de crédito', boleto: 'Boleto', debit: 'Débito' };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-['Outfit'] font-black text-3xl text-foreground">Financeiro e taxas</h1>
            <p className="text-foreground/30 text-sm mt-1">
              Taxas lidas direto da sua conta Asaas · atualizado {new Date(fees.fetchedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {fees.environment === 'sandbox' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold">Sandbox: taxas de teste</span>
            )}
            <button onClick={() => load(true)} disabled={refreshing} className="px-3 py-2 rounded-lg border border-foreground/10 text-foreground/60 text-sm hover:bg-foreground/5 disabled:opacity-50">
              {refreshing ? 'Atualizando…' : '↻ Atualizar'}
            </button>
          </div>
        </div>

        {/* Resumo */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Saldo no Asaas', value: brl(summary.balance), accent: true },
              { label: `Recebido (${summary.paidBookings} reserva${summary.paidBookings === 1 ? '' : 's'})`, value: brl(summary.gross) },
              { label: 'Taxas do Asaas', value: brl(summary.fees), negative: true },
              { label: 'Líquido para você', value: brl(summary.net) },
              { label: 'Desconto Pix concedido', value: brl(summary.pixDiscountGiven), negative: true },
            ].map(s => (
              <div key={s.label} className={`${card} !p-4`}>
                <p className={`font-['Outfit'] font-black text-xl ${s.accent ? 'text-[#F97316]' : s.negative ? 'text-red-400' : 'text-foreground'}`}>{s.value}</p>
                <p className="text-foreground/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {summary && summary.estimatedCount > 0 && (
          <p className="text-foreground/30 text-xs -mt-3">* {summary.estimatedCount} pagamento(s) com taxa estimada pela tabela atual; os novos passam a usar o valor exato informado pelo Asaas.</p>
        )}
        {summary && Object.keys(summary.byMethod).length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(summary.byMethod).map(([m, v]) => (
              <span key={m} className="px-3 py-1.5 rounded-lg bg-foreground/5 text-foreground/50">
                {methodLabel[m] || m}: {v.count} · {brl(v.gross)} · taxas {brl(v.fees)} ({v.gross ? pct((v.fees / v.gross) * 100) : '—'})
              </span>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pix */}
          <div className={card}>
            <h2 className={h2}>Pix</h2>
            <p className="text-foreground/30 text-sm mb-5">Recebimento na hora</p>
            <div className="flex items-end gap-3 mb-4">
              <p className="font-['Outfit'] font-black text-4xl text-foreground">
                {fees.pix.type === 'PERCENTAGE' ? pct(fees.pix.percentageFee) : brl(fees.pix.fee)}
              </p>
              <p className="text-foreground/40 text-sm pb-1.5">por Pix recebido</p>
            </div>
            {fees.pix.discountUntil && fees.pix.defaultFee !== fees.pix.fee && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                🏷️ Taxa promocional até {date(fees.pix.discountUntil)}. Depois volta para {brl(fees.pix.defaultFee)}.
              </p>
            )}
            {fees.pix.monthlyFree > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground/50">Pix recebidos sem taxa neste mês</span>
                  <span className="text-foreground font-semibold">{fees.pix.usedThisMonth} de {fees.pix.monthlyFree}</span>
                </div>
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#32BCAD]" style={{ width: `${Math.min(100, (fees.pix.usedThisMonth / fees.pix.monthlyFree) * 100)}%` }} />
                </div>
              </div>
            )}
            <p className="text-foreground/40 text-xs">Lembre que o site já dá <strong className="text-foreground/70">5% de desconto</strong> no Pix para o cliente. Esse desconto sai da sua margem.</p>
          </div>

          {/* Cartão */}
          <div className={card}>
            <h2 className={h2}>Cartão de crédito</h2>
            <p className="text-foreground/30 text-sm mb-5">
              + {brl(fees.creditCard.operationFee)} por transação · recebimento em ~{fees.creditCard.daysToReceive} dias
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-foreground/30 text-xs text-left">
                  <th className="pb-2 font-semibold">Parcelamento</th>
                  <th className="pb-2 font-semibold text-right">Taxa atual</th>
                  {fees.creditCard.discountUntil && <th className="pb-2 font-semibold text-right">Taxa normal</th>}
                </tr>
              </thead>
              <tbody>
                {fees.creditCard.tiers.map(t => (
                  <tr key={t.label} className="border-t border-foreground/5">
                    <td className="py-2.5 text-foreground/70">{t.label}</td>
                    <td className="py-2.5 text-right text-foreground font-bold">{pct(t.percentage)}</td>
                    {fees.creditCard.discountUntil && <td className="py-2.5 text-right text-foreground/30 line-through">{pct(t.defaultPercentage)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {fees.creditCard.discountUntil && (
              <p className="text-xs text-amber-300 mt-3">🏷️ Taxas promocionais até {date(fees.creditCard.discountUntil)}.</p>
            )}
            <p className="text-foreground/40 text-xs mt-3">
              O site oferece <strong className="text-foreground/70">até 12x sem juros</strong>: a taxa do parcelamento é paga por você, não pelo cliente.
              {fees.anticipation.creditCardInstallmentMonthlyPercentage != null && (
                <> Para receber antes, a antecipação custa {pct(fees.anticipation.creditCardSingleMonthlyPercentage)} ao mês (à vista) ou {pct(fees.anticipation.creditCardInstallmentMonthlyPercentage)} ao mês (parcelado).</>
              )}
            </p>
          </div>
        </div>

        {/* Simulador */}
        <div className={card}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
            <div>
              <h2 className={h2}>Simulador</h2>
              <p className="text-foreground/30 text-sm">
                {simMode === 'price'
                  ? 'Quanto sobra de uma venda depois do desconto Pix e das taxas do Asaas.'
                  : 'Informe quanto quer receber e veja o preço que o pacote precisa ter.'}
              </p>
            </div>
            <div className="flex p-1 rounded-xl bg-foreground/5 border border-foreground/10 self-start">
              {([['price', 'Tenho o preço'], ['target', 'Quero receber']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSimMode(k)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${simMode === k ? 'bg-[#F97316] text-white' : 'text-foreground/50 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {simMode === 'price' ? (
          <div className="grid md:grid-cols-[280px_1fr] gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide">Valor do pacote</label>
                  <input type="number" min={0} step="0.01" value={simValue} onChange={e => setSimValue(Number(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['pix', 'credit'] as const).map(m => (
                    <button key={m} onClick={() => { setSimMethod(m); if (m === 'pix') setSimInstallments(1); }}
                      className={`py-2.5 rounded-xl text-sm font-semibold border ${simMethod === m ? 'border-[#F97316] bg-[#F97316]/10 text-white' : 'border-foreground/10 text-foreground/50 hover:bg-foreground/5'}`}>
                      {m === 'pix' ? 'Pix' : 'Cartão'}
                    </button>
                  ))}
                </div>
                {simMethod === 'credit' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide">Parcelas</label>
                    <select value={simInstallments} onChange={e => setSimInstallments(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-surface text-foreground">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Preço do pacote', value: brl(simValue) },
                  { label: simMethod === 'pix' ? 'Cliente paga (−5% Pix)' : `Cliente paga (${simInstallments}x de ${brl(customerPays / simInstallments)})`, value: brl(customerPays) },
                  { label: 'Taxa do Asaas', value: `− ${brl(simFee)}`, red: true },
                  { label: 'Você recebe', value: brl(youReceive), big: true },
                ].map(r => (
                  <div key={r.label} className={`rounded-xl p-4 ${r.big ? 'bg-[#F97316]/10 border border-[#F97316]/30' : 'bg-foreground/[0.03]'}`}>
                    <p className="text-foreground/40 text-xs">{r.label}</p>
                    <p className={`font-['Outfit'] font-black ${r.big ? 'text-2xl text-[#F97316]' : 'text-lg'} ${r.red ? 'text-red-400' : r.big ? '' : 'text-foreground'}`}>{r.value}</p>
                  </div>
                ))}
                <div className="sm:col-span-2 text-xs text-foreground/40 space-y-1">
                  <p>Custo total sobre o preço do pacote: <strong className="text-foreground/70">{pct(effective)}</strong>{simMethod === 'pix' ? ' (desconto Pix + taxa)' : ''}</p>
                  <p>Quando cai na conta: <strong className="text-foreground/70">{receiveText}</strong></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-[280px_1fr] gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground/30 block mb-1.5 uppercase tracking-wide">Quero receber (por pessoa)</label>
                  <input type="number" min={0} step="0.01" value={target} onChange={e => setTarget(Number(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-foreground/5 text-foreground" />
                </div>

                <div className="rounded-xl p-4 bg-[#F97316]/10 border border-[#F97316]/30">
                  <p className="text-foreground/50 text-xs">Preço recomendado do pacote</p>
                  <p className="font-['Outfit'] font-black text-3xl text-[#F97316]">{brl(recommended.price)}</p>
                  <p className="text-foreground/40 text-xs mt-1">
                    Garante pelo menos {brl(target)} em qualquer forma de pagamento (o pior caso é {recommended.label}).
                  </p>
                  <button onClick={() => { setSimValue(recommended.price); setSimMethod('pix'); setSimInstallments(1); setSimMode('price'); }}
                    className="mt-3 w-full py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold">
                    Simular com este preço →
                  </button>
                </div>

                {target > 0 && cheapest.price < recommended.price && (
                  <p className="text-foreground/40 text-xs">
                    Se você cobrar o preço mínimo ({brl(cheapest.price)}, pelo {cheapest.label}), quem pagar em {recommended.label} deixa só {brl(netFor(fees, cheapest.price, recommended.method, recommended.installments))} para você.
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-foreground/30 text-xs text-left">
                      <th className="pb-2 font-semibold">Forma de pagamento</th>
                      <th className="pb-2 font-semibold text-right">Preço necessário</th>
                      <th className="pb-2 font-semibold text-right">Cliente paga</th>
                      <th className="pb-2 font-semibold text-right">Taxa Asaas</th>
                      <th className="pb-2 font-semibold text-right">Você recebe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetRows.map(r => (
                      <tr key={r.label} className={`border-t border-foreground/5 ${r === recommended ? 'bg-[#F97316]/5' : ''}`}>
                        <td className="py-2 text-foreground/70">{r.label}{r === recommended && <span className="ml-2 text-[10px] text-[#F97316] font-bold">PIOR CASO</span>}</td>
                        <td className="py-2 text-right text-foreground font-bold">{brl(r.price)}</td>
                        <td className="py-2 text-right text-foreground/60">
                          {brl(r.pays)}{r.installments > 1 && <span className="text-foreground/30 text-xs"> ({r.installments}x {brl(r.pays / r.installments)})</span>}
                        </td>
                        <td className="py-2 text-right text-red-400">− {brl(r.fee)}</td>
                        <td className="py-2 text-right text-foreground">{brl(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Saques */}
          <div className={card}>
            <h2 className={h2}>Saques e transferências</h2>
            <p className="text-foreground/30 text-sm mb-4">Para tirar o dinheiro do Asaas para sua conta bancária</p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between"><span className="text-foreground/60">Transferências grátis por mês</span><span className="text-foreground font-semibold">{fees.transfer.monthlyFree}</span></li>
              <li className="flex justify-between"><span className="text-foreground/60">Pix para outra conta {fees.transfer.pixCountsInFree ? '(após as grátis)' : ''}</span><span className="text-foreground font-semibold">{brl(fees.transfer.pixFee)}</span></li>
              <li className="flex justify-between"><span className="text-foreground/60">TED {fees.transfer.tedCountsInFree ? '(após as grátis)' : '(sempre cobrada)'}</span><span className="text-foreground font-semibold">{brl(fees.transfer.tedFee)}</span></li>
            </ul>
            <p className="text-foreground/40 text-xs mt-4">Dica: prefira sacar por Pix, que entra nas transferências grátis do mês.</p>
          </div>

          {/* Notificações */}
          <div className={card}>
            <h2 className={h2}>Notificações e extras</h2>
            <p className="text-foreground/30 text-sm mb-4">Cobrados por envio quando ativados na conta Asaas</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['E-mail', 'Grátis'],
                ['SMS', brl(fees.notifications.sms)],
                ['WhatsApp', brl(fees.notifications.whatsApp)],
                ['Robô de voz', brl(fees.notifications.voice)],
                ['Mensageria', brl(fees.notifications.messaging)],
                ['Carta pelos Correios', brl(fees.notifications.postal)],
                ['Nota fiscal (por emissão)', brl(fees.other.invoice)],
                ['Negativação (Serasa)', brl(fees.other.dunning)],
              ].map(([l, v]) => (
                <li key={l} className="flex justify-between"><span className="text-foreground/60">{l}</span><span className="text-foreground font-semibold">{v}</span></li>
              ))}
            </ul>
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-4">
              ⚠️ Confira no painel do Asaas (Configurações → Notificações) se SMS e WhatsApp estão ligados. Cada envio é cobrado e a mesma cobrança pode gerar vários avisos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
