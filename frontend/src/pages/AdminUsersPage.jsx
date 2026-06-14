import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import {
  Loader2, Search, Users, ShieldCheck, Ban, Trash2,
  ChevronLeft, ChevronRight, Store, X,
  UserCheck, UserX, Plus,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const ROLES = ['Tous', 'user', 'admin'];
const STATUSES = ['Tous', 'active', 'banned'];
const PAGE_SIZE = 15;

const uid = u => u?._id || u?.id || '';

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    blue:    'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
    red:     'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
    green:   'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
};

const UserModal = ({ user: u, onClose, onAction }) => {
  if (!u) return null;
  const status = u.status || 'active';
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">
              {u.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{u.name || '—'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{u.email || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Rôle</p>
            <Badge variant={u.role === 'admin' ? 'amber' : 'blue'}>
              {u.role === 'admin' ? '⚡ Admin' : '👤 Utilisateur'}
            </Badge>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Statut</p>
            <Badge variant={status === 'banned' ? 'red' : 'green'}>
              {status === 'banned' ? '🚫 Banni' : '✓ Actif'}
            </Badge>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Boutiques</p>
            <p className="font-bold text-slate-900 dark:text-white">{u.shopsCount ?? 0}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Inscrit le</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onAction(uid(u), 'role', u.role === 'admin' ? 'owner' : 'admin')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-xl text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            {u.role === 'admin' ? 'Retirer admin' : 'Rendre admin'}
          </button>
          <button
            onClick={() => onAction(uid(u), 'status', status === 'banned' ? 'active' : 'banned')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              status === 'banned'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100'
                : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100'
            }`}
          >
            {status === 'banned' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            {status === 'banned' ? 'Débannir' : 'Bannir'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'owner' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/admin/users', formData);
      onSuccess(res.data?.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Ajouter un utilisateur</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Nom complet</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none dark:text-white"
              placeholder="Ex: Jean Dupont" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none dark:text-white"
              placeholder="jean@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mot de passe</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none dark:text-white"
              placeholder="••••••••" minLength="6" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Rôle</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none dark:text-white">
              <option value="owner">Utilisateur (User)</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch whenever filter params change
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (roleFilter !== 'Tous') params.set('role', roleFilter);
    if (statusFilter !== 'Tous') params.set('status', statusFilter);

    api.get(`/admin/users?${params}`)
      .then(res => {
        const d = res.data?.data;
        setUsers(d?.users || (Array.isArray(d) ? d : []) || []);
        setTotal(d?.total || res.data?.total || 0);
      })
      .catch(err => {
        console.error(err);
        setError('Impossible de charger les utilisateurs.');
      })
      .finally(() => setIsLoading(false));
  }, [page, roleFilter, statusFilter, debouncedSearch]);

  const handleAction = async (userId, field, value) => {
    try {
      await api.put(`/admin/users/${userId}`, { [field]: value });
      const update = u => (uid(u) === userId) ? { ...u, [field]: value } : u;
      setUsers(prev => prev.map(update));
      if (selectedUser && uid(selectedUser) === userId) setSelectedUser(prev => ({ ...prev, [field]: value }));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => uid(u) !== userId));
      if (selectedUser && uid(selectedUser) === userId) setSelectedUser(null);
    } catch (err) { console.error(err); }
  };

  if (currentUser?.role !== 'admin') return <Navigate to="/dashboard" />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateUserModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={(newUser) => {
              setUsers(prev => [newUser, ...prev].slice(0, PAGE_SIZE));
              setTotal(t => t + 1);
            }}
          />
        )}
        {selectedUser && (
          <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onAction={handleAction} />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer cet utilisateur ?"
        message={`${confirmDelete?.name || 'Cet utilisateur'} sera définitivement supprimé. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={() => handleDelete(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Administration</p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Utilisateurs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total.toLocaleString('fr-FR')} utilisateurs enregistrés</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Ajouter un utilisateur
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {ROLES.map(r => (
              <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${roleFilter === r ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400'}`}>
                {r === 'Tous' ? 'Tous' : r === 'admin' ? '⚡ Admin' : '👤 User'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}>
                {s === 'Tous' ? 'Tous' : s === 'active' ? '✓ Actifs' : '🚫 Bannis'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-sm text-red-700 dark:text-red-400">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Users className="w-12 h-12 mb-3 opacity-50" />
              <p className="font-medium text-slate-600 dark:text-slate-400">Aucun utilisateur trouvé</p>
              <p className="text-sm">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                    {['Utilisateur', 'Rôle', 'Statut', 'Boutiques', 'Inscrit le', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {users.map((u, i) => {
                    const id = uid(u);
                    const status = u.status || 'active';
                    return (
                      <motion.tr key={id || i}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(u)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{u.name || '—'}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={u.role === 'admin' ? 'amber' : 'blue'}>
                            {u.role === 'admin' ? '⚡ Admin' : '👤 User'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={status === 'banned' ? 'red' : 'green'}>
                            {status === 'banned' ? '🚫 Banni' : '✓ Actif'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <Store className="w-3.5 h-3.5" />
                            <span className="font-medium">{u.shopsCount ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleAction(id, 'role', u.role === 'admin' ? 'owner' : 'admin')}
                              title={u.role === 'admin' ? 'Retirer admin' : 'Rendre admin'}
                              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAction(id, 'status', status === 'banned' ? 'active' : 'banned')}
                              title={status === 'banned' ? 'Débannir' : 'Bannir'}
                              className={`p-1.5 rounded-lg transition-colors ${status === 'banned' ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500'}`}>
                              <Ban className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmDelete({ id, name: u.name })} title="Supprimer"
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && users.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {page} sur {totalPages} · {total} résultats</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminUsersPage;
