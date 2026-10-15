import { useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '../../store/AppContext';
import { imageUrl } from '../../services/api';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminEventos() {
  const { excursions, bookings, deleteExcursion, updateExcursion } = useApp();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = excursions.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.eventCity.toLowerCase().includes(search.toLowerCase()) ||
    e.eventName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteExcursion(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    }
    setConfirmDelete(null);
  };
  const toggleActive = (id: string, active: boolean) => {
    updateExcursion(id, { active }).catch(err => alert(err instanceof Error ? err.message : 'Erro ao atualizar'));
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-['Outfit'] font-black text-3xl text-foreground">Eventos</h1>
            <p className="text-foreground/30 text-sm mt-1">{excursions.length} pacotes cadastrados</p>
          </div>
          <Link to="/admin/eventos/novo" className="inline-flex items-center gap-2 px-5 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-black rounded-xl transition-colors">
            + Novo evento
          </Link>
        </div>

        <div className="mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, evento ou cidade…"
            className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-foreground/10 text-sm outline-none focus:border-[#F97316] bg-card text-foreground placeholder-foreground/20 transition-colors" />
        </div>

        <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/5">
                  {['Evento', 'Data', 'Vagas', 'Preço', 'Status', 'Ações'].map(h => (
                    <th key={h} className={`text-left px-5 py-4 text-xs font-semibold text-foreground/20 uppercase tracking-wide ${h === 'Vagas' || h === 'Data' ? 'hidden md:table-cell' : h === 'Ações' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filtered.map(exc => (
                  <tr key={exc.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0">
                          <img src={imageUrl(exc.image, 100, 80)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#F97316] text-xs font-bold uppercase truncate">{exc.eventName}</p>
                          <p className="font-semibold text-foreground text-sm truncate max-w-[200px]">{exc.departureCity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-foreground/40 text-xs hidden md:table-cell">{exc.eventDate}</td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-foreground/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${Math.min(100, (exc.bookedSpots / exc.maxSpots) * 100)}%` }} />
                        </div>
                        <span className="text-foreground/30 text-xs">{exc.bookedSpots}/{exc.maxSpots}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-['Outfit'] font-bold text-foreground">{formatCurrency(exc.price)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleActive(exc.id, !exc.active)} className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${exc.active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-foreground/10 text-foreground/30 hover:bg-foreground/20'}`}>
                          {exc.active ? 'Ativo' : 'Inativo'}
                        </button>
                        {exc.bookedSpots >= exc.maxSpots && (
                          <span className="text-xs px-2 py-1 rounded-lg font-semibold bg-red-500/20 text-red-400">Esgotado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/eventos/${exc.id}/participantes`}
                          className="px-3 py-1.5 rounded-lg border border-[#F97316]/30 text-[#F97316] text-xs font-semibold hover:bg-[#F97316]/10 transition-colors flex items-center gap-1"
                        >
                          👥 <span className="hidden sm:inline">Participantes</span>
                          <span className="bg-[#F97316]/20 text-[#F97316] text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {bookings.filter(b => b.excursionId === exc.id).length}
                          </span>
                        </Link>
                        <Link to={`/admin/eventos/editar/${exc.id}`} className="px-3 py-1.5 rounded-lg border border-foreground/10 text-foreground/40 text-xs font-semibold hover:border-foreground/30 hover:text-foreground transition-colors">
                          Editar
                        </Link>
                        <button onClick={() => setConfirmDelete(exc.id)} className="px-3 py-1.5 rounded-lg border border-foreground/10 text-red-400/50 text-xs font-semibold hover:border-red-400/30 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🎟️</p>
              <p className="text-foreground/30 text-sm">Nenhum evento encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-card border border-foreground/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-4xl">⚠️</span>
              <h3 className="font-['Outfit'] font-bold text-xl text-foreground mt-3 mb-2">Confirmar exclusão</h3>
              <p className="text-foreground/40 text-sm">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl border border-foreground/10 text-foreground/50 font-semibold text-sm hover:border-foreground/30 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
