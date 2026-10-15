import { Link } from 'react-router';
import { useApp } from '../../store/AppContext';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminDashboard() {
  const { excursions, bookings } = useApp();

  const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
  const pendingPayments = bookings.filter(b => b.paymentStatus === 'pending').length;
  const activeEvents = excursions.filter(e => e.active).length;
  const soldOutEvents = excursions.filter(e => e.bookedSpots >= e.maxSpots).length;

  const recentBookings = [...bookings].slice(0, 5);
  const popularExcursions = [...excursions].filter(e => e.active).sort((a, b) => b.bookedSpots - a.bookedSpots).slice(0, 5);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-foreground/20 text-xs font-semibold uppercase tracking-widest mb-1">Painel Admin</p>
          <h1 className="font-['Outfit'] font-black text-3xl text-foreground">Dashboard</h1>
          <p className="text-foreground/30 text-sm mt-1">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Receita confirmada', value: formatCurrency(totalRevenue), icon: '💰', color: 'text-green-400', glow: 'shadow-green-900/20' },
            { label: 'Total de reservas', value: String(bookings.length), icon: '🎟️', color: 'text-blue-400', glow: 'shadow-blue-900/20' },
            { label: 'Eventos ativos', value: String(activeEvents), icon: '🎪', color: 'text-[#F97316]', glow: 'shadow-orange-900/20' },
            { label: 'Pag. pendentes', value: String(pendingPayments), icon: '⏳', color: 'text-amber-400', glow: 'shadow-amber-900/20' },
          ].map(stat => (
            <div key={stat.label} className={`bg-card rounded-2xl p-6 border border-foreground/10 shadow-lg ${stat.glow}`}>
              <span className="text-2xl block mb-4">{stat.icon}</span>
              <p className={`font-['Outfit'] font-black text-2xl ${stat.color}`}>{stat.value}</p>
              <p className="text-foreground/30 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent bookings */}
          <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10">
              <h2 className="font-['Outfit'] font-bold text-base text-foreground">Últimas reservas</h2>
              <Link to="/admin/reservas" className="text-[#F97316] text-xs font-semibold hover:underline">Ver todas →</Link>
            </div>
            <div className="divide-y divide-foreground/5">
              {recentBookings.map(b => (
                <div key={b.id} className="px-6 py-4 flex items-center justify-between hover:bg-foreground/5 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{b.customerName}</p>
                    <p className="text-xs text-foreground/30 truncate">{b.excursionTitle}</p>
                    <p className="text-xs text-foreground/20 mt-0.5">{b.seats} pessoa{b.seats > 1 ? 's' : ''} · {b.bookingDate}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-['Outfit'] font-bold text-sm text-foreground">{formatCurrency(b.totalAmount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      b.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                      b.paymentStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {b.paymentStatus === 'paid' ? 'Pago' : b.paymentStatus === 'pending' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular events */}
          <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10">
              <h2 className="font-['Outfit'] font-bold text-base text-foreground">Pacotes mais vendidos</h2>
              <Link to="/admin/eventos" className="text-[#F97316] text-xs font-semibold hover:underline">Gerenciar →</Link>
            </div>
            <div className="divide-y divide-foreground/5">
              {popularExcursions.map(exc => {
                const pct = Math.round((exc.bookedSpots / exc.maxSpots) * 100);
                return (
                  <div key={exc.id} className="px-6 py-4 hover:bg-foreground/5 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[#F97316] text-xs font-bold uppercase">{exc.eventName}</p>
                        <p className="font-semibold text-sm text-foreground truncate">{exc.departureCity}</p>
                        <p className="text-xs text-foreground/30">{exc.bookedSpots}/{exc.maxSpots} vagas · {exc.eventDate}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-3 flex-shrink-0 ${
                        pct >= 100 ? 'bg-red-500/20 text-red-400' :
                        pct >= 70 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {pct >= 100 ? 'ESGOTADO' : `${pct}%`}
                      </span>
                    </div>
                    <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : 'bg-[#F97316]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 bg-[#F97316]/10 border border-[#F97316]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <h3 className="font-['Outfit'] font-bold text-foreground text-lg">Criar novo pacote de evento</h3>
            <p className="text-foreground/30 text-sm">Adicione uma nova excursão.</p>
          </div>
          <Link to="/admin/eventos/novo" className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black rounded-xl transition-colors whitespace-nowrap">
            + Novo evento
          </Link>
        </div>
      </div>
    </div>
  );
}
