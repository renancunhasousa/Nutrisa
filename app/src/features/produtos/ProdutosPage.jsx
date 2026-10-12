import { useCallback, useEffect, useMemo, useState } from 'react';
import { Beef, CheckCircle2, FlaskConical, Flame, Package, PackageOpen, Pencil, Plus, Search, Trash2, Wheat, X } from 'lucide-react';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import { researchProduct } from '../../shared/services/aiClient.js';
import { useAuth } from '../auth/useAuth.js';
import ProductFormDialog from './components/ProductFormDialog.jsx';
import { LipidIcon } from '../dietas/components/LipidIcon.jsx';
import { lookupProductByBarcode, normalizeBarcodeInput } from './services/productLookup.js';
import {
  archiveProduct,
  createProduct,
  listProducts,
  removeProductImage,
  updateProduct,
  uploadProductImage,
} from './services/products.js';

const CATEGORY_LABELS = { alimento: 'Alimento', preparacao: 'Preparação', produto: 'Produto', suplemento: 'Suplemento', bebida: 'Bebida', outro: 'Outro' };

export default function ProdutosPage() {
  const { organizationId, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await listProducts(organizationId));
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return products.filter((product) => {
      const matchesCategory = category === 'todos' || (product.item_type || product.category) === category;
      const matchesQuery = !query || [product.name, product.brand, product.barcode]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [category, products, search]);

  const metrics = useMemo(() => ({
    total: products.length,
    dietItems: products.filter((product) => product.is_available_for_diets).length,
    verified: products.filter((product) => product.verification_status === 'verified').length,
    draft: products.filter((product) => product.verification_status !== 'verified').length,
    sources: Object.entries(products.reduce((counts, product) => {
      const source = product.official_source?.trim() || (product.source_type === 'manual' ? 'Manual' : product.source_type);
      counts[source] = (counts[source] || 0) + 1;
      return counts;
    }, {})).sort((left, right) => right[1] - left[1]),
  }), [products]);

  const openNew = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const lookupBarcode = async (barcodeValue) => {
    const barcode = normalizeBarcodeInput(barcodeValue);
    const existing = products.find((item) => normalizeBarcodeInput(item.barcode) === barcode);
    if (existing && existing.id !== editingProduct?.id) {
      throw new Error(`“${existing.name}” já está cadastrado com este código de barras.`);
    }
    if (existing) return { product: existing, provider: 'catalog' };
    return lookupProductByBarcode(barcode);
  };

  const saveProduct = async (form, imageFile) => {
    let uploadedImage = null;
    try {
      if (imageFile) uploadedImage = await uploadProductImage(organizationId, imageFile);
      const values = { ...form, ...(uploadedImage || {}) };
      const saved = editingProduct
        ? await updateProduct(organizationId, editingProduct.id, user.id, values)
        : await createProduct(organizationId, user.id, values);

      if (editingProduct?.image_path && (!saved.image_path || editingProduct.image_path !== saved.image_path)) {
        await removeProductImage(editingProduct.image_path).catch(() => {});
      }
      setProducts((current) => editingProduct
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')));
    } catch (saveError) {
      if (uploadedImage?.image_path) await removeProductImage(uploadedImage.image_path).catch(() => {});
      throw saveError;
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Arquivar “${product.name}”? Ele deixará de aparecer no catálogo.`)) return;
    try {
      await archiveProduct(organizationId, product.id, user.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (archiveError) {
      setError(archiveError.message || 'Não foi possível arquivar o produto.');
    }
  };

  return (
    <div className="animate-fadeIn space-y-5">
      <PageHeader
        category="Base da clínica"
        title="Alimentos e produtos"
        description="Gerencie alimentos, preparações, produtos, suplementos e bebidas em um catálogo nutricional único."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar item</span>
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do catálogo">
        <Metric label="Itens cadastrados" value={metrics.total} icon={<Package className="size-5" />} />
        <Metric label="Fontes nutricionais" icon={<FlaskConical className="size-5" />}>
          <div className="mt-1 flex flex-wrap gap-1">
            {metrics.sources.length ? metrics.sources.map(([source, count]) => (
              <span key={source} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{source}: {count}</span>
            )) : <span className="text-xs text-slate-400">Nenhuma fonte</span>}
          </div>
        </Metric>
        <Metric label="Disponíveis nas dietas" value={metrics.dietItems} icon={<FlaskConical className="size-5" />} />
        <Metric label="Verificados / revisar" icon={<CheckCircle2 className="size-5" />}>
          <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
            <span className="text-emerald-600">{metrics.verified} verificados</span>
            <span className="text-amber-600">{metrics.draft} revisar</span>
          </div>
        </Metric>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="product-list-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="product-list-title" className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-slate-900">
              <PackageOpen className="size-3.5 text-emerald-600" aria-hidden="true" />
              <span>Catálogo da clínica</span>
            </h2>
            <p className="text-xs text-slate-500">A IA aparece apenas para interpretar a imagem do rótulo e sempre exige revisão.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form role="search" onSubmit={(event) => event.preventDefault()} className="relative min-w-0 sm:w-72">
              <label htmlFor="product-search" className="sr-only">Buscar produto</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input id="product-search" name="product-search" type="search" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, marca ou código" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-base sm:text-sm" />
            </form>
            <label htmlFor="product-category-filter" className="sr-only">Filtrar por categoria</label>
            <select id="product-category-filter" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-700 sm:text-sm">
              <option value="todos">Todos os tipos</option><option value="alimento">Alimentos</option><option value="preparacao">Preparações</option><option value="produto">Produtos</option><option value="suplemento">Suplementos</option><option value="bebida">Bebidas</option>
            </select>
          </div>
        </div>

        {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

        {loading ? (
          <p className="py-16 text-center text-sm font-semibold text-slate-500">Carregando catálogo…</p>
        ) : filteredProducts.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} onEdit={() => openEdit(product)} onArchive={() => removeProduct(product)} />)}
          </div>
        ) : (
          <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
            <PackageOpen className="mb-3 size-11 text-slate-300" />
            <h3 className="text-lg font-black text-slate-800">{products.length ? 'Nenhum produto encontrado' : 'Comece seu catálogo'}</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">{products.length ? 'Ajuste a busca ou o filtro de categoria.' : 'Cadastre manualmente, busque pelo código ou use uma imagem para preencher um rascunho.'}</p>
            {!products.length ? (
              <button
                type="button"
                onClick={openNew}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar primeiro item</span>
              </button>
            ) : null}
          </div>
        )}
      </section>

      <ProductFormDialog open={dialogOpen} product={editingProduct} onClose={() => setDialogOpen(false)} onSave={saveProduct} onBarcodeLookup={lookupBarcode} onResearch={researchProduct} />
    </div>
  );
}

function Metric({ label, value, icon, children }) {
  return <article className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <span className="flex size-10 items-center justify-center rounded-xl text-emerald-700">{icon}</span>
    <div className="min-w-0"><strong className="block text-xl font-black text-slate-900">{value}</strong><span className="text-xs font-semibold text-slate-500">{label}</span>{children}</div>
  </article>;
}

function ProductCard({ product, onEdit, onArchive }) {
  const verified = product.verification_status === 'verified';
  const official = product.organization_id === null;
  return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-slate-100">
      {product.image_url ? <img src={product.image_url} alt={`Embalagem de ${product.name}`} loading="lazy" className="size-full object-cover" /> : <PackageOpen className="size-12 text-slate-300" />}
      <span
        className={`absolute left-3 top-3 inline-flex size-7 items-center justify-center rounded-full ${verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}
        title={verified ? 'Verificado' : 'Revisar'}
        aria-label={verified ? 'Verificado' : 'Revisar'}
      >
        {verified ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
      </span>
      {official ? <span className="absolute right-3 top-3 text-[10px] font-semibold text-slate-500">Somente leitura</span> : null}
    </div>
    <div className="p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">{CATEGORY_LABELS[product.item_type || product.category] || 'Item'}</p>
      <h3 className="mt-0.5 line-clamp-2 text-base font-black text-slate-900">{product.name}</h3>
      <p className="mt-0.5 min-h-5 text-xs font-semibold text-slate-500">{product.brand || product.food_group || 'Cadastro da clínica'}{product.reference_quantity ? ` · Base ${formatNumber(product.reference_quantity)} ${product.reference_unit || 'g'}` : ''}</p>
      <dl className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-slate-50 p-2 text-center">
        <Macro label="Calorias" icon={Flame} iconClassName="text-amber-700" value={product.calories} />
        <Macro label="Proteínas" icon={Beef} iconClassName="text-rose-600" value={product.protein_g} suffix="g" />
        <Macro label="Carboidratos" icon={Wheat} iconClassName="text-amber-600" value={product.carbs_g} suffix="g" />
        <Macro label="Gorduras" icon={LipidIcon} iconClassName="text-teal-600" value={product.fat_g} suffix="g" />
      </dl>
      <div className="mt-4 flex gap-2">
        {official ? null : <>
          <button type="button" onClick={onEdit} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil className="size-3.5" /> Editar</button>
          <button type="button" onClick={onArchive} className="flex size-10 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Arquivar ${product.name}`}><Trash2 className="size-4" /></button>
        </>}
      </div>
    </div>
  </article>;
}

function Macro({ label, icon: Icon, iconClassName, value, suffix = '' }) {
  return <div title={label}><dt className={`flex justify-center ${iconClassName}`}><Icon className="size-4" aria-hidden="true" /></dt><dd className="mt-0.5 text-xs font-black text-slate-700">{value === null || value === undefined ? '—' : `${formatNumber(value)}${suffix}`}</dd></div>;
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value));
}
