import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Styled confirmation modal — a replacement for window.confirm().
 *
 *   const [confirm, setConfirm] = useState(null);
 *   setConfirm({ title, message, onConfirm });
 *   <ConfirmDialog open={!!confirm} {...confirm} onClose={() => setConfirm(null)} />
 */
const ConfirmDialog = ({
  open,
  title = 'Confirmer',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = true,
  onConfirm,
  onClose,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-sm bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{title}</h3>
          {message && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>}

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm?.(); onClose?.(); }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
