import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Package,
  Tag,
  DollarSign,
  Settings,
  Layers,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useShop } from '../hooks/useShop';
import { useCategories } from '../hooks/useCategories';
import { useCreateProduct, useProduct, useUpdateProduct } from '../hooks/useProducts';
import ImageUploader from '../components/ImageUploader';

/* ─── helpers ─────────────────────────────────────────────────── */
const emptyVariant = () => ({ name: 'Standard', sku: '', price: '', stock_qty: 0, alert_threshold: 5 });

const initialForm = {
  name: '', description: '', price: '', compare_price: '',
  sku: '', status: 'draft', category_id: '', images: [],
  variants: [emptyVariant()],
};

const toNumberOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/* ─── Reusable field components ─────────────────────────────── */
const Label = ({ children, required }) => (
  <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
    {children}{required && <span className="text-red-500 ml-1">*</span>}
  </span>
);

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition";

const SectionCard = ({ title, icon: Icon, iconColor = 'text-indigo-600', children, badge }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor === 'text-indigo-600' ? 'bg-indigo-50 dark:bg-indigo-950/40' : iconColor === 'text-emerald-600' ? 'bg-emerald-50 dark:bg-emerald-950/40' : iconColor === 'text-amber-600' ? 'bg-amber-50 dark:bg-amber-950/40' : iconColor === 'text-purple-600' ? 'bg-purple-50 dark:bg-purple-950/40' : 'bg-slate-50 dark:bg-slate-800'}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h2>
      </div>
      {badge}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ─── Status selector ────────────────────────────────────────── */
const StatusSelector = ({ value, onChange }) => {
  const options = [
    { value: 'draft',    label: 'Brouillon', desc: 'Non visible',  icon: EyeOff,        bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-300 dark:border-amber-700',   text: 'text-amber-700 dark:text-amber-400' },
    { value: 'active',   label: 'Actif',     desc: 'Visible',      icon: Eye,            bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-400' },
    { value: 'archived', label: 'Archivé',   desc: 'Désactivé',    icon: Package,        bg: 'bg-slate-50 dark:bg-slate-800',       border: 'border-slate-300 dark:border-slate-700',   text: 'text-slate-500' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map(opt => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${selected ? `${opt.bg} ${opt.border}` : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
          >
            <Icon className={`w-4 h-4 ${selected ? opt.text : 'text-slate-400'}`} />
            <span className={`text-xs font-bold ${selected ? opt.text : 'text-slate-500'}`}>{opt.label}</span>
            <span className={`text-[10px] ${selected ? opt.text : 'text-slate-400'}`}>{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ─── Variant card ───────────────────────────────────────────── */
const VariantCard = ({ variant, index, onChange, onRemove }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 text-xs font-black">
          {index + 1}
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {variant.name || `Variante ${index + 1}`}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>

    {/* Fields */}
    <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <Label>Nom de la variante</Label>
        <input
          value={variant.name}
          onChange={e => onChange(index, 'name', e.target.value)}
          className={inputClass}
          placeholder="Ex: Rouge / Taille M"
        />
      </div>
      <div>
        <Label>SKU</Label>
        <input
          value={variant.sku}
          onChange={e => onChange(index, 'sku', e.target.value)}
          className={inputClass}
          placeholder="SKU-001"
        />
      </div>
      <div>
        <Label>Prix (optionnel)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">TND</span>
          <input
            type="number" min="0" step="0.01"
            value={variant.price}
            onChange={e => onChange(index, 'price', e.target.value)}
            className={`${inputClass} pl-10`}
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <Label>Stock initial</Label>
        <input
          type="number" min="0"
          value={variant.stock_qty}
          onChange={e => onChange(index, 'stock_qty', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <Label>Seuil d'alerte</Label>
        <input
          type="number" min="0"
          value={variant.alert_threshold}
          onChange={e => onChange(index, 'alert_threshold', e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  </div>
);

/* ─── Main form page ─────────────────────────────────────────── */
const ProductFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: shop, isLoading: isShopLoading } = useShop();
  const { data: categories = [] } = useCategories(shop?.id);
  const { data: product, isLoading: isProductLoading } = useProduct(shop?.id, id);
  const createProduct = useCreateProduct(shop?.id);
  const updateProduct = useUpdateProduct(shop?.id);

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!product) return;
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price == null ? '' : String(product.price),
      compare_price: product.compare_price == null ? '' : String(product.compare_price),
      sku: product.sku || '',
      status: product.status || 'draft',
      category_id: product.category_id || '',
      images: product.images || [],
      variants: product.variants?.length > 0
        ? product.variants.map(v => ({ id: v.id, name: v.name || '', sku: v.sku || '', price: v.price == null ? '' : String(v.price), stock_qty: Number(v.stock_qty || 0), alert_threshold: Number(v.alert_threshold || 0) }))
        : [emptyVariant()],
    });
  }, [product]);

  const isLoading  = isShopLoading || (isEditing && isProductLoading);
  const isSaving   = createProduct.isPending || updateProduct.isPending;

  const updateField   = (f, v)       => setFormData(cur => ({ ...cur, [f]: v }));
  const updateVariant = (i, f, v)    => setFormData(cur => ({ ...cur, variants: cur.variants.map((va, idx) => idx === i ? { ...va, [f]: v } : va) }));
  const addVariant    = ()           => setFormData(cur => ({ ...cur, variants: [...cur.variants, emptyVariant()] }));
  const removeVariant = (i)          => setFormData(cur => ({ ...cur, variants: cur.variants.length === 1 ? [emptyVariant()] : cur.variants.filter((_, idx) => idx !== i) }));

  const buildPayload = () => ({
    name: formData.name.trim(),
    description: formData.description.trim() || null,
    price: Number(formData.price),
    compare_price: toNumberOrNull(formData.compare_price),
    sku: formData.sku.trim() || null,
    status: formData.status,
    category_id: formData.category_id || null,
    images: formData.images,
    variants: formData.variants.map(v => ({
      ...(v.id ? { id: v.id } : {}),
      name: v.name.trim() || 'Standard',
      sku: v.sku.trim() || null,
      price: toNumberOrNull(v.price),
      stock_qty: Number(v.stock_qty || 0),
      alert_threshold: Number(v.alert_threshold || 0),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!shop?.id) { setError('Aucune boutique active.'); return; }
    if (!formData.name.trim() || formData.price === '') { setError('Le nom et le prix sont obligatoires.'); return; }
    try {
      const payload = buildPayload();
      if (isEditing) { await updateProduct.mutateAsync({ id, ...payload }); }
      else           { await createProduct.mutateAsync(payload); }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/products'), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    }
  };

  /* ── Loading ── */
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-500 animate-pulse font-medium">Chargement…</p>
    </div>
  );

  /* ── No shop ── */
  if (!shop) return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-indigo-500" />
      </div>
      <h1 className="text-xl font-black text-slate-900 mb-2">Boutique requise</h1>
      <p className="text-slate-500 mb-5">Créez votre boutique avant d'ajouter des produits.</p>
      <button onClick={() => navigate('/onboarding')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">
        Créer ma boutique
      </button>
    </div>
  );

  /* ── Discount % ── */
  const discountPct = formData.compare_price && formData.price && Number(formData.compare_price) > Number(formData.price)
    ? Math.round((1 - Number(formData.price) / Number(formData.compare_price)) * 100)
    : null;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl pb-16 space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/products')}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
            </p>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEditing ? (formData.name || 'Modification') : 'Créer un produit'}
            </h1>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/products')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSaving || success}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-70 ${
              success
                ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:scale-105 hover:shadow-indigo-500/50'
            }`}
          >
            {isSaving   ? <Loader2 className="w-4 h-4 animate-spin" /> :
             success     ? <CheckCircle className="w-4 h-4" /> :
                          <Save className="w-4 h-4" />}
            {success ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* ── Error / Success ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

        {/* Left column */}
        <div className="space-y-6">

          {/* General info */}
          <SectionCard title="Informations générales" icon={Package} iconColor="text-indigo-600">
            <div className="space-y-4">
              <div>
                <Label required>Nom du produit</Label>
                <input
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  className={inputClass}
                  placeholder="Ex: T-shirt coton premium"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={formData.description}
                  onChange={e => updateField('description', e.target.value)}
                  rows={5}
                  className={inputClass}
                  placeholder="Décrivez le produit, ses matières, son usage et ses points forts…"
                />
              </div>
            </div>
          </SectionCard>

          {/* Images */}
          <SectionCard title="Images du produit" icon={ImageIcon} iconColor="text-purple-600">
            <ImageUploader
              value={formData.images}
              onChange={imgs => updateField('images', imgs)}
              max={8}
            />
          </SectionCard>

          {/* Variants */}
          <SectionCard
            title="Variantes & Stock"
            icon={Layers}
            iconColor="text-emerald-600"
            badge={
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            }
          >
            <p className="text-xs text-slate-500 mb-4">Chaque variante possède son propre stock et seuil d'alerte.</p>
            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <VariantCard
                  key={variant.id || index}
                  variant={variant}
                  index={index}
                  onChange={updateVariant}
                  onRemove={removeVariant}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Pricing */}
          <SectionCard title="Tarification" icon={DollarSign} iconColor="text-amber-600">
            <div className="space-y-4">
              <div>
                <Label required>Prix de vente (TND)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">TND</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={formData.price}
                    onChange={e => updateField('price', e.target.value)}
                    className={`${inputClass} pl-12`}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Prix barré (avant réduction)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">TND</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={formData.compare_price}
                    onChange={e => updateField('compare_price', e.target.value)}
                    className={`${inputClass} pl-12`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              {discountPct && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Économie de {discountPct}% affichée sur le produit
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Status */}
          <SectionCard title="Statut de publication" icon={Eye} iconColor="text-indigo-600">
            <StatusSelector value={formData.status} onChange={v => updateField('status', v)} />
          </SectionCard>

          {/* Organisation */}
          <SectionCard title="Organisation" icon={Tag} iconColor="text-slate-500">
            <div className="space-y-4">
              <div>
                <Label>SKU du produit</Label>
                <div className="relative">
                  <Settings className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    value={formData.sku}
                    onChange={e => updateField('sku', e.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="SKU-GLOBAL-001"
                  />
                </div>
              </div>
              <div>
                <Label>Catégorie</Label>
                <select
                  value={formData.category_id}
                  onChange={e => updateField('category_id', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sans catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Preview card */}
          {formData.name && (
            <div className="rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Aperçu carte</p>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center font-black text-indigo-600 mb-2">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{formData.name}</p>
                {formData.price && (
                  <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm mt-0.5">
                    {Number(formData.price).toFixed(2)} TND
                    {discountPct && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">-{discountPct}%</span>}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProductFormPage;
