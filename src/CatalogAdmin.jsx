import { useEffect, useState } from 'react';

const passwordStorageKey = 'nogree-catalog-admin-password';

function requestOptions(password, options = {}) {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-catalog-admin-password': password,
      ...(options.headers || {}),
    },
  };
}

export default function CatalogAdmin({ onExit }) {
  const [password, setPassword] = useState(() => sessionStorage.getItem(passwordStorageKey) || '');
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState(password ? 'loading' : 'locked');
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState(null);

  async function loadCatalog(nextPassword = password) {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/admin/catalog', requestOptions(nextPassword));
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not open the catalog.');

      sessionStorage.setItem(passwordStorageKey, nextPassword);
      setProducts(result.products);
      setStatus('ready');
    } catch (error) {
      sessionStorage.removeItem(passwordStorageKey);
      setStatus('locked');
      setMessage(error.message || 'Could not open the catalog.');
    }
  }

  useEffect(() => {
    if (password) loadCatalog();
  }, []);

  function updateProduct(id, changes) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, ...changes } : product)));
  }

  async function saveProduct(product) {
    setSavingId(product.id);
    setMessage('');

    try {
      const response = await fetch('/api/admin/catalog', requestOptions(password, {
        method: 'PATCH',
        body: JSON.stringify({
          id: product.id,
          heroImageUrl: product.hero_image_url || '',
          description: product.description || '',
          displayOrder: Number(product.display_order),
        }),
      }));
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not save the product.');

      updateProduct(product.id, result.product);
      setMessage(`${result.product.name} saved.`);
    } catch (error) {
      setMessage(error.message || 'Could not save the product.');
    } finally {
      setSavingId(null);
    }
  }

  function logout() {
    sessionStorage.removeItem(passwordStorageKey);
    setPassword('');
    setProducts([]);
    setStatus('locked');
    setMessage('');
  }

  if (status === 'locked') {
    return (
      <main className="grid min-h-screen place-items-center bg-bone px-6 text-ink">
        <form
          className="w-full max-w-md border-y border-ink py-12"
          onSubmit={(event) => {
            event.preventDefault();
            loadCatalog(password);
          }}
        >
          <p className="brand-mark">no·gree</p>
          <p className="mt-12 text-[0.65rem] font-black uppercase tracking-[0.38em] text-ink/55">Private catalog</p>
          <h1 className="logo-serif mt-4 text-5xl leading-none">Curation room.</h1>
          <label className="mt-10 block text-[0.65rem] font-black uppercase tracking-[0.25em]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-3 h-14 w-full border border-ink bg-transparent px-4 text-base outline-none focus:bg-white/30"
          />
          {message ? <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-red-800">{message}</p> : null}
          <button type="submit" className="mt-7 min-h-14 w-full bg-ink px-6 text-xs font-black uppercase tracking-[0.25em] text-bone transition hover:bg-bone hover:text-ink hover:outline hover:outline-1 hover:outline-ink">
            Enter catalog
          </button>
          <button type="button" onClick={onExit} className="mt-7 text-xs font-black uppercase tracking-[0.2em] underline underline-offset-4">Return to site</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bone px-6 py-7 text-ink sm:px-10 lg:px-16">
      <header className="flex items-center justify-between border-b border-ink/25 pb-6">
        <div>
          <p className="brand-mark">no·gree</p>
          <p className="mt-3 text-[0.62rem] font-black uppercase tracking-[0.3em] text-ink/55">Private catalog / Drop 01</p>
        </div>
        <div className="flex gap-5 text-[0.65rem] font-black uppercase tracking-[0.2em]">
          <button type="button" onClick={logout} className="underline underline-offset-4">Lock</button>
          <button type="button" onClick={onExit} className="underline underline-offset-4">View site</button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl py-12 sm:py-16">
        <div className="flex flex-col justify-between gap-6 border-b border-ink/25 pb-8 sm:flex-row sm:items-end">
          <div>
            <h1 className="logo-serif text-5xl leading-none sm:text-7xl">Art direction.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-ink/65">Printful controls the sellable variants. This room controls the image and language customers encounter first.</p>
          </div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-ink/55">{products.length} pieces</p>
        </div>

        {status === 'loading' ? <p className="py-16 text-xs font-black uppercase tracking-[0.24em]">Opening catalog...</p> : null}

        <div className="divide-y divide-ink/25">
          {products.map((product) => {
            const heroUrl = product.hero_image_url || product.printful_image_url;
            const isSaving = savingId === product.id;

            return (
              <article key={product.id} className="grid gap-8 py-10 lg:grid-cols-[13rem_minmax(0,1fr)_11rem] lg:items-start">
                <div className="aspect-square overflow-hidden bg-ink/10">
                  {heroUrl ? <img src={heroUrl} alt="" className="h-full w-full object-cover mix-blend-multiply" /> : null}
                </div>
                <div>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.3em] text-ink/55">{product.active ? 'Live product' : 'Hidden product'}</p>
                  <h2 className="logo-serif mt-3 text-4xl leading-none">{product.name}</h2>

                  <label className="mt-8 block text-[0.62rem] font-black uppercase tracking-[0.25em]">Hero image URL</label>
                  <input
                    type="url"
                    value={product.hero_image_url || ''}
                    onChange={(event) => updateProduct(product.id, { hero_image_url: event.target.value })}
                    placeholder={product.printful_image_url || 'https://'}
                    className="mt-3 h-12 w-full border border-ink/35 bg-transparent px-3 text-sm outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => updateProduct(product.id, { hero_image_url: '' })}
                    className="mt-3 text-[0.62rem] font-black uppercase tracking-[0.2em] underline underline-offset-4"
                  >
                    Use Printful default
                  </button>

                  <label className="mt-8 block text-[0.62rem] font-black uppercase tracking-[0.25em]">Storefront line</label>
                  <textarea
                    value={product.description || ''}
                    onChange={(event) => updateProduct(product.id, { description: event.target.value })}
                    rows="3"
                    className="mt-3 w-full resize-y border border-ink/35 bg-transparent px-3 py-3 text-sm leading-6 outline-none focus:border-ink"
                  />
                </div>
                <div className="lg:pt-8">
                  <label className="block text-[0.62rem] font-black uppercase tracking-[0.25em]">Drop order</label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={product.display_order}
                    onChange={(event) => updateProduct(product.id, { display_order: event.target.value })}
                    className="mt-3 h-12 w-24 border border-ink/35 bg-transparent px-3 text-sm outline-none focus:border-ink"
                  />
                  <button
                    type="button"
                    onClick={() => saveProduct(product)}
                    disabled={isSaving}
                    className="mt-8 min-h-12 w-full bg-ink px-4 text-[0.62rem] font-black uppercase tracking-[0.2em] text-bone transition hover:bg-bone hover:text-ink hover:outline hover:outline-1 hover:outline-ink disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save piece'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {message ? <p className="mt-8 text-xs font-black uppercase tracking-[0.16em]" role="status">{message}</p> : null}
      </section>
    </main>
  );
}
