import { useEffect, useState } from 'react';
import CatalogAdmin from './CatalogAdmin.jsx';

const wordmark = 'no\u00b7gree';
const usStates = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['FL', 'Florida'], ['GA', 'Georgia'],
  ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'],
  ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

function colorSwatch(color) {
  const swatches = {
    black: '#11100f',
    graphite: '#57524d',
    'dark heather': '#605f5c',
    'true navy': '#202838',
    natural: '#d8c8ae',
    white: '#f4f0e7',
  };

  return swatches[color.trim().toLowerCase()] || '#9b9284';
}

function viewFromHash() {
  if (window.location.hash === '#catalog-admin') return 'catalog-admin';
  if (window.location.hash.startsWith('#order-status')) return 'order-status';
  return window.location.hash.startsWith('#drop-01') ? 'drop' : 'landing';
}

function selectionFromHash() {
  const query = window.location.hash.split('?')[1];
  if (!query) return null;

  const params = new URLSearchParams(query);
  const variantId = Number(params.get('variant'));
  const quantity = Number(params.get('quantity'));

  return Number.isInteger(variantId) && variantId > 0
    ? { variantId, quantity: Number.isInteger(quantity) && quantity > 0 ? Math.min(quantity, 10) : 1 }
    : null;
}

function App() {
  const [view, setView] = useState(viewFromHash);
  const [reorderSelection, setReorderSelection] = useState(selectionFromHash);

  function openDrop() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.hash = 'drop-01';
    window.history.replaceState({}, '', url);
    setReorderSelection(null);
    setView('drop');
  }

  function openReorder(item) {
    if (!Number.isInteger(item.productVariantId)) return;

    const selection = { variantId: item.productVariantId, quantity: Math.min(item.quantity, 10) };
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.hash = `drop-01?variant=${selection.variantId}&quantity=${selection.quantity}`;
    window.history.replaceState({}, '', url);
    setReorderSelection(selection);
    setView('drop');
  }

  function closeDrop() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.hash = '';
    window.history.replaceState({}, '', url);
    setView('landing');
  }

  function closeCatalogAdmin() {
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState({}, '', url);
    setView('landing');
  }

  function openCatalogAdmin() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.hash = 'catalog-admin';
    window.history.replaceState({}, '', url);
    setView('catalog-admin');
  }

  function openOrderStatus() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.hash = 'order-status';
    window.history.replaceState({}, '', url);
    setView('order-status');
  }

  const checkoutState = new URLSearchParams(window.location.search).get('checkout');

  if (checkoutState === 'success' || checkoutState === 'cancelled') {
    return <CheckoutReturn state={checkoutState} onContinue={checkoutState === 'success' ? openDrop : closeDrop} />;
  }

  if (view === 'drop') {
    return <DropShop onExit={closeDrop} reorderSelection={reorderSelection} />;
  }

  if (view === 'catalog-admin') {
    return <CatalogAdmin onExit={closeCatalogAdmin} />;
  }

  if (view === 'order-status') {
    return <OrderStatus onExit={closeDrop} onReorder={openReorder} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bone text-ink selection:bg-ink selection:text-bone">
      <EditorialBackground />

      <section className="relative z-10 flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between text-sm font-black uppercase tracking-[0.22em] sm:text-base">
          <a href="/" className="brand-mark inline-flex min-h-11 items-center tracking-normal sm:min-h-0" aria-label="no·gree home">
            {wordmark}
          </a>
          <button type="button" onClick={openOrderStatus} className="min-h-11 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink transition hover:underline hover:underline-offset-4 sm:text-[0.68rem]">
            Order status
          </button>
        </header>

        <div className="relative grid flex-1 items-center gap-0 pb-8 pt-9 sm:pt-16 lg:grid-cols-1 lg:gap-12 lg:pt-10">
          <div className="relative z-20 max-w-4xl">
            <p className="animate-reveal text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-smoke/70 [animation-delay:120ms]">
              Drop 01 / Now available
            </p>

            <h1 className="hero-word mt-4 animate-reveal text-[clamp(4.5rem,16vw,13.5rem)] lowercase leading-[0.8] [animation-delay:220ms] sm:mt-5">
              {wordmark}
            </h1>

            <div className="mt-7 max-w-3xl animate-reveal [animation-delay:340ms] sm:mt-12">
              <p className="tagline text-balance text-lg font-semibold uppercase leading-[1.8] tracking-[0.18em] sm:text-xl">
                Emotional language from Lagos
                <br />
                Worn with resistance.
              </p>
            </div>

            <div className="relative z-30 mt-8 flex w-full max-w-xl animate-reveal flex-col gap-1 [animation-delay:460ms] sm:mt-12 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={openDrop}
                className="group relative min-h-16 overflow-hidden bg-ink px-7 text-xs font-black uppercase tracking-[0.28em] text-bone transition duration-300 hover:bg-bone hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bone sm:min-w-60"
              >
                <span className="absolute inset-0 origin-left scale-x-0 bg-bone transition-transform duration-300 group-hover:scale-x-100" />
                <span className="relative">Shop the drop</span>
              </button>
              <a
                href="https://www.instagram.com/no.gree.for.anybody/"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow no·gree on Instagram"
                className="inline-flex min-h-11 items-center self-start gap-2 px-2 py-2 text-ink/65 transition hover:text-ink sm:min-h-16 sm:px-4"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
                <span className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] underline decoration-ink/35 underline-offset-4 sm:hidden">
                  Follow us
                </span>
                <span className="hidden text-[0.64rem] font-semibold uppercase tracking-[0.18em] underline decoration-ink/35 underline-offset-4 sm:inline">
                  Follow us on Instagram
                </span>
              </a>
            </div>
          </div>

          <aside className="model-panel animate-slideIn [animation-delay:280ms]" aria-hidden="true">
            <img
              className="hero-photo"
              src="/assets/nogree-hero.png"
              alt=""
              draggable="false"
            />
            <div className="photo-wash" />
            <div className="tear-strip tear-one" />
            <div className="tear-strip tear-two" />
          </aside>
        </div>

        <footer className="hero-footer relative z-20 flex items-center justify-between gap-4 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-bone mix-blend-difference sm:text-[0.68rem] sm:tracking-[0.28em]">
          <span>No gree for anybody.</span>
          <button
            type="button"
            onClick={openCatalogAdmin}
            className="shrink-0 text-bone/45 transition hover:text-bone focus:outline-none focus-visible:text-bone focus-visible:underline focus-visible:underline-offset-4"
          >
            Catalog admin
          </button>
        </footer>
      </section>
    </main>
  );
}

function CheckoutReturn({ state, onContinue }) {
  const isSuccess = state === 'success';

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bone px-6 text-ink">
      <div className="pointer-events-none absolute inset-0 grain opacity-25 mix-blend-multiply" />
      <section className="relative w-full max-w-2xl border-y border-ink py-12 text-center sm:py-16">
        <p className="brand-mark">{wordmark}</p>
        <p className="mt-12 text-[0.65rem] font-black uppercase tracking-[0.42em]">Drop 01</p>
        <h1 className="logo-serif mt-5 text-5xl leading-none sm:text-7xl">
          {isSuccess ? 'Order received.' : 'Selection held.'}
        </h1>
        <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-ink/70">
          {isSuccess
            ? 'Your payment is confirmed. Your NO GREE order number and status link are in your email.'
            : 'No payment was taken. Your selection is waiting in Drop 01.'}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-11 min-h-14 border border-ink px-8 text-xs font-black uppercase tracking-[0.25em] transition hover:bg-ink hover:text-bone"
        >
          {isSuccess ? 'Return to Drop 01' : 'Return to selection'}
        </button>
      </section>
    </main>
  );
}

function OrderStatus({ onExit, onReorder }) {
  const initialReference = new URLSearchParams(window.location.hash.split('?')[1] || '').get('order') || '';
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function lookupOrder(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setOrder(null);

    try {
      const response = await fetch('/api/order-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference, email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not find that order.');
      setOrder(result.order);
    } catch (error) {
      setMessage(error.message || 'Could not retrieve that order.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bone px-6 py-7 text-ink sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute inset-0 grain opacity-25 mix-blend-multiply" />
      <section className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col">
        <header className="flex items-center justify-between text-sm font-black uppercase tracking-[0.22em] sm:text-base">
          <button type="button" onClick={onExit} className="brand-mark min-h-11 tracking-normal" aria-label="Return to no·gree home">{wordmark}</button>
          <button type="button" onClick={onExit} className="min-h-11 text-[0.65rem] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">Return</button>
        </header>

        <div className="my-auto py-16 sm:py-24">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.32em] text-ink/55">Order status</p>
          <h1 className="logo-serif mt-4 text-5xl leading-none sm:text-7xl">Find your order.</h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-ink/65">Use the NO GREE order number from your confirmation email and the email used at checkout.</p>

          <form onSubmit={lookupOrder} className="mt-10 grid max-w-xl gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="Order number" aria-label="Order number" autoCapitalize="characters" className="h-14 min-w-0 border border-ink/35 bg-transparent px-4 text-sm font-semibold uppercase tracking-[0.12em] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/40 focus:border-ink" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" aria-label="Email address" type="email" autoComplete="email" className="h-14 min-w-0 border border-ink/35 bg-transparent px-4 text-sm outline-none placeholder:text-ink/40 focus:border-ink" />
            <button type="submit" disabled={isLoading} className="h-14 bg-ink px-6 text-[0.65rem] font-black uppercase tracking-[0.2em] text-bone transition hover:bg-bone hover:text-ink hover:outline hover:outline-1 hover:outline-ink disabled:cursor-wait disabled:opacity-60">{isLoading ? 'Checking' : 'Check'}</button>
          </form>

          {message ? <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-red-800" role="status">{message}</p> : null}

          {order ? (
            <section className="mt-12 max-w-xl border-y border-ink py-7 sm:py-9" aria-live="polite">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.26em] text-ink/55">{order.reference}</p>
                  <h2 className="logo-serif mt-3 text-3xl leading-none sm:text-4xl">{order.status}</h2>
                </div>
                <p className="pt-1 text-right text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/55">
                  Placed<br />{new Date(order.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {order.refundedAt ? <><br /><br />Refunded<br />{new Date(order.refundedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</> : null}
                </p>
              </div>

              <div className="mt-8 border-t border-ink/15 pt-6 text-sm leading-7 text-ink/70">
                {order.items.map((item) => (
                  <p key={`${item.productVariantId || item.productName}-${item.variantLabel}`}>
                    {Number.isInteger(item.productVariantId) ? (
                      <button type="button" onClick={() => onReorder(item)} className="text-left underline decoration-ink/40 underline-offset-4 transition hover:decoration-ink">
                        {item.quantity} × {item.productName} / {item.variantLabel}
                      </button>
                    ) : `${item.quantity} × ${item.productName} / ${item.variantLabel}`}
                  </p>
                ))}
              </div>

              {order.shipments.length > 0 ? (
                <div className="mt-7 space-y-5 border-t border-ink/15 pt-6">
                  {order.shipments.map((shipment, index) => (
                    <div key={`${shipment.tracking_number || 'shipment'}-${index}`}>
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-ink/55">{shipment.carrier || 'Shipment'} {shipment.service ? `/ ${shipment.service}` : ''}</p>
                      {shipment.tracking_url ? <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">Track package</a> : <p className="mt-2 text-sm text-ink/70">Tracking is updating.</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-7 border-t border-ink/15 pt-6 text-sm leading-7 text-ink/65">
                  {order.status === 'Refunded'
                    ? 'This order was refunded. No fulfillment or shipment will follow.'
                    : 'Your pieces are being prepared. Carrier tracking will appear here once the package leaves the facility.'}
                </p>
              )}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function DropShop({ onExit, reorderSelection }) {
  const [products, setProducts] = useState([]);
  const [activeProductId, setActiveProductId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showVariantImage, setShowVariantImage] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [quote, setQuote] = useState(null);
  const [actionStatus, setActionStatus] = useState('idle');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDrop() {
      try {
        const response = await fetch('/api/products');
        const result = await response.json();

        if (!response.ok || !result.products?.length) {
          throw new Error(result.error || 'Drop 01 is not available yet.');
        }

        if (!active) return;

        const requestedVariant = result.products
          .flatMap((product) => product.variants.map((variant) => ({ product, variant })))
          .find(({ variant }) => variant.available && variant.id === reorderSelection?.variantId);
        const firstProduct = requestedVariant?.product || result.products[0];
        const firstVariant = requestedVariant?.variant || firstProduct.variants.find((variant) => variant.available);
        setProducts(result.products);
        setActiveProductId(firstProduct.id);
        setSelectedColor(firstVariant?.color || '');
        setSelectedSize(firstVariant?.size || '');
        setShowVariantImage(Boolean(requestedVariant));
        setQuantity(requestedVariant ? reorderSelection.quantity : 1);
      } catch (error) {
        if (active) setLoadError(error.message || 'Could not load Drop 01.');
      }
    }

    loadDrop();
    return () => {
      active = false;
    };
  }, [reorderSelection]);

  if (loadError) {
    return <DropNotice message={loadError} onExit={onExit} />;
  }

  const product = products.find((item) => item.id === activeProductId) || products[0];

  if (!product) {
    return <DropNotice message="Loading Drop 01." onExit={onExit} />;
  }

  const colors = [...new Set(product.variants.filter((variant) => variant.available).map((variant) => variant.color))];
  const sizes = product.variants
    .filter((variant) => variant.available && variant.color === selectedColor)
    .map((variant) => variant.size);
  const selectedVariant = product.variants.find(
    (variant) => variant.available && variant.color === selectedColor && variant.size === selectedSize,
  );
  const selectedColorImage = product.variants.find(
    (variant) => variant.available && variant.color === selectedColor,
  )?.imageUrl;
  const productIndex = products.findIndex((item) => item.id === product.id) + 1;
  const displayImage = product.hasCuratedHero && !showVariantImage
    ? product.imageUrl
    : selectedColorImage || product.imageUrl;

  function resetQuote() {
    setQuote(null);
    setActionMessage('');
  }

  function addToSelection() {
    if (!selectedVariant) return;

    const alreadySelected = cart.some((item) => item.variantId === selectedVariant.id);

    if (!alreadySelected && cart.length >= 6) {
      setCartMessage('A selection can hold up to six pieces.');
      setCartOpen(true);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.variantId === selectedVariant.id);

      if (existing) {
        return current.map((item) => (
          item.variantId === selectedVariant.id
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item
        ));
      }

      return [...current, {
        variantId: selectedVariant.id,
        productName: product.heroTitle,
        color: selectedColor,
        size: selectedSize,
        priceCents: selectedVariant.priceCents,
        imageUrl: displayImage,
        quantity,
      }];
    });

    resetQuote();
    setCartMessage(`${product.heroTitle} added to your selection.`);
    setCartOpen(true);
  }

  function updateCartQuantity(variantId, nextQuantity) {
    setCart((current) => current.flatMap((item) => {
      if (item.variantId !== variantId) return [item];
      return nextQuantity > 0 ? [{ ...item, quantity: Math.min(10, nextQuantity) }] : [];
    }));
    resetQuote();
  }

  function removeFromSelection(variantId) {
    setCart((current) => current.filter((item) => item.variantId !== variantId));
    resetQuote();
  }

  function chooseColor(color) {
    const nextSize = product.variants.find((variant) => variant.available && variant.color === color)?.size || '';
    setSelectedColor(color);
    setSelectedSize(nextSize);
    setShowVariantImage(true);
    resetQuote();
  }

  function chooseProduct(nextProduct) {
    const firstVariant = nextProduct.variants.find((variant) => variant.available);
    setActiveProductId(nextProduct.id);
    setSelectedColor(firstVariant?.color || '');
    setSelectedSize(firstVariant?.size || '');
    setShowVariantImage(false);
    setQuantity(1);
    resetQuote();
  }

  async function calculateShipping() {
    if (cart.length === 0) return;

    setActionStatus('quoting');
    setActionMessage('');

    try {
      const response = await fetch('/api/shipping-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          stateCode,
          zip,
        }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not calculate shipping.');

      setQuote(result);
      setActionStatus('idle');
    } catch (error) {
      setActionStatus('idle');
      setActionMessage(error.message || 'Could not calculate shipping.');
    }
  }

  async function startCheckout() {
    if (cart.length === 0 || !quote) return;

    setActionStatus('checking-out');
    setActionMessage('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          stateCode,
          zip,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.url) throw new Error(result.error || 'Could not start checkout.');

      window.location.assign(result.url);
    } catch (error) {
      setActionStatus('idle');
      setActionMessage(error.message || 'Could not start checkout.');
    }
  }

  const itemTotal = selectedVariant ? selectedVariant.priceCents * quantity : 0;
  const selectionTotal = cart.reduce((total, item) => total + item.priceCents * item.quantity, 0);
  const selectionCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <main className="min-h-screen bg-bone text-ink selection:bg-ink selection:text-bone">
      <p className="sr-only" aria-live="polite">{`${product.heroTitle}, ${selectedColor}, size ${selectedSize} selected.`}</p>
      <header className="flex items-center justify-between border-b border-ink/25 px-6 py-5 sm:px-10 sm:py-6 lg:px-16">
        <button type="button" onClick={onExit} className="brand-mark inline-flex min-h-11 items-center sm:min-h-0" aria-label="Return to no·gree home">
          {wordmark}
        </button>
        <p className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.24em] sm:block">Drop 01 / {String(products.length).padStart(2, '0')} pieces</p>
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => setCartOpen(true)} className="min-h-11 text-[0.68rem] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">
            Selection {String(selectionCount).padStart(2, '0')}
          </button>
          <button type="button" onClick={onExit} className="min-h-11 text-[0.68rem] font-semibold uppercase tracking-[0.2em] underline underline-offset-4">
            Exit
          </button>
        </div>
      </header>

      <nav
        className="product-rail flex snap-x snap-mandatory overflow-x-auto border-b border-ink/25 px-6 sm:snap-none sm:px-10 lg:px-16"
        aria-label="Drop 01 products"
      >
        {products.map((item, index) => {
          const isActive = item.id === product.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseProduct(item)}
              aria-pressed={isActive}
              className={`group relative w-44 shrink-0 snap-start border-r border-ink/25 px-4 py-3 text-left transition first:border-l sm:w-56 sm:px-7 sm:py-5 ${isActive ? 'bg-ink text-bone' : 'hover:bg-ink hover:text-bone'}`}
            >
              <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.2em] opacity-55 sm:text-[0.56rem] sm:tracking-[0.24em]">
                {String(index + 1).padStart(2, '0')} / Drop 01
              </span>
              <span className="mt-2 block truncate text-xs font-semibold uppercase tracking-[0.13em]">
                {item.selectorTitle}
              </span>
            </button>
          );
        })}
      </nav>

      <section className="grid min-h-[calc(100vh-10.8rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(25rem,0.88fr)]">
        <div className="relative flex min-h-[36vh] items-center justify-center overflow-hidden bg-[#d9d0c0] px-6 py-8 sm:min-h-[54vh] sm:px-14 sm:py-14 lg:min-h-0 lg:px-20">
          <div className="pointer-events-none absolute inset-0 opacity-20 grain mix-blend-multiply" />
          <p className="pointer-events-none absolute left-[5%] top-[7%] font-display text-[clamp(5rem,15vw,14rem)] leading-none text-ink/5">{String(productIndex).padStart(2, '0')}</p>
          <img
            src={displayImage}
            alt={`${product.heroTitle} in ${selectedColor}`}
            className="relative z-10 h-auto max-h-[44vh] w-full max-w-2xl object-contain mix-blend-multiply sm:max-h-[72vh]"
          />
          <p className="absolute bottom-5 left-6 z-10 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] sm:bottom-10 sm:left-10 sm:text-[0.62rem] sm:tracking-[0.25em]">
            Emotional language from Lagos
          </p>
        </div>

        <section className="flex flex-col border-t border-ink/25 px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-14 lg:py-14">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-ink/55 sm:text-[0.66rem] sm:tracking-[0.28em]">{product.collection}</p>
            <h1 className="mt-4 max-w-xl text-balance logo-serif text-[clamp(2.8rem,7vw,4rem)] leading-[0.9]">{product.heroTitle}</h1>
            <p className="mt-7 text-base font-semibold tracking-[0.06em]">${(itemTotal / 100).toFixed(2)}</p>
          </div>

          <div className="mt-10 border-t border-ink/25 pt-8">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] sm:text-[0.65rem] sm:tracking-[0.24em]">Color</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => chooseColor(color)}
                  aria-pressed={selectedColor === color}
                  className={`inline-flex min-h-12 items-center gap-2 border px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition ${selectedColor === color ? 'border-ink bg-ink text-bone' : 'border-ink/35 hover:border-ink'}`}
                >
                  <span className="h-3 w-3 rounded-full border border-current/30" style={{ backgroundColor: colorSwatch(color) }} />
                  {color}
                </button>
              ))}
            </div>

            <p className="mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] sm:text-[0.65rem] sm:tracking-[0.24em]">Size</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setSelectedSize(size); resetQuote(); }}
                  aria-pressed={selectedSize === size}
                  className={`h-12 border text-xs font-semibold uppercase tracking-[0.14em] transition ${selectedSize === size ? 'border-ink bg-ink text-bone' : 'border-ink/35 hover:border-ink'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-ink/25 pt-8">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] sm:text-[0.65rem] sm:tracking-[0.24em]">Quantity</p>
                <div className="mt-4 flex h-12 border border-ink/35">
                  <button type="button" onClick={() => { setQuantity(Math.max(1, quantity - 1)); resetQuote(); }} className="h-12 w-12 text-lg transition active:bg-ink active:text-bone hover:bg-ink hover:text-bone" aria-label="Decrease quantity">-</button>
                  <output className="grid w-12 place-items-center border-x border-ink/35 text-sm font-black">{quantity}</output>
                  <button type="button" onClick={() => { setQuantity(Math.min(10, quantity + 1)); resetQuote(); }} className="h-12 w-12 text-lg transition active:bg-ink active:text-bone hover:bg-ink hover:text-bone" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <p className="max-w-44 text-right text-[0.6875rem] font-semibold uppercase leading-5 tracking-[0.14em] text-ink/55 sm:text-[0.63rem] sm:font-black sm:tracking-[0.18em]">
                U.S. delivery only
              </p>
            </div>
            <button
              type="button"
              onClick={addToSelection}
              className="mt-8 min-h-14 w-full border border-ink bg-transparent px-6 text-xs font-black uppercase tracking-[0.24em] transition hover:bg-ink hover:text-bone"
            >
              Add to selection
            </button>
          </div>
        </section>
      </section>
      <SelectionDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        cartMessage={cartMessage}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromSelection}
        stateCode={stateCode}
        setStateCode={setStateCode}
        zip={zip}
        setZip={setZip}
        quote={quote}
        selectionTotal={selectionTotal}
        actionStatus={actionStatus}
        actionMessage={actionMessage}
        onCalculateShipping={calculateShipping}
        onCheckout={startCheckout}
        onResetQuote={resetQuote}
      />
    </main>
  );
}

function SelectionDrawer({
  isOpen,
  onClose,
  cart,
  cartMessage,
  onUpdateQuantity,
  onRemove,
  stateCode,
  setStateCode,
  zip,
  setZip,
  quote,
  selectionTotal,
  actionStatus,
  actionMessage,
  onCalculateShipping,
  onCheckout,
  onResetQuote,
}) {
  if (!isOpen) return null;

  const pieceCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/35" role="presentation">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close selection" />
      <aside className="relative z-10 mt-auto max-h-[90dvh] w-full overflow-y-auto border-t border-ink bg-bone px-6 py-7 shadow-[-20px_0_60px_rgba(13,12,11,0.2)] sm:mt-0 sm:h-full sm:max-h-none sm:max-w-md sm:border-l sm:border-t-0 sm:px-8 sm:py-9" role="dialog" aria-modal="true" aria-label="Your selection">
        <header className="flex items-start justify-between border-b border-ink/25 pb-6">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink/55">Drop 01</p>
            <h2 className="mt-3 logo-serif text-4xl leading-none">Selection.</h2>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 text-[0.68rem] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">Close</button>
        </header>

        {cart.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink/55">Your selection is waiting.</p>
            <button type="button" onClick={onClose} className="mt-8 min-h-12 border border-ink px-6 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-ink hover:text-bone">Continue browsing</button>
          </div>
        ) : (
          <>
            <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/55">{pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'} selected</p>
            {cartMessage ? <p className="sr-only" role="status">{cartMessage}</p> : null}

            <div className="divide-y divide-ink/20">
              {cart.map((item) => (
                <article key={item.variantId} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-6">
                  <div className="aspect-square overflow-hidden bg-[#d9d0c0]">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain mix-blend-multiply" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="logo-serif text-2xl leading-none">{item.productName}</h3>
                        <p className="mt-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink/60">{item.color} / {item.size}</p>
                      </div>
                      <button type="button" onClick={() => onRemove(item.variantId)} className="min-h-11 text-[0.62rem] font-semibold uppercase tracking-[0.14em] underline underline-offset-4">Remove</button>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <div className="flex h-11 border border-ink/35">
                        <button type="button" onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)} className="h-11 w-11 text-lg transition hover:bg-ink hover:text-bone" aria-label={`Decrease ${item.productName} quantity`}>-</button>
                        <output className="grid w-10 place-items-center border-x border-ink/35 text-sm font-semibold">{item.quantity}</output>
                        <button type="button" onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)} className="h-11 w-11 text-lg transition hover:bg-ink hover:text-bone" aria-label={`Increase ${item.productName} quantity`}>+</button>
                      </div>
                      <p className="text-sm font-semibold">${((item.priceCents * item.quantity) / 100).toFixed(2)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-y border-ink py-5">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-[0.18em]">
                <span>Selection</span>
                <span>${(selectionTotal / 100).toFixed(2)}</span>
              </div>
              {quote ? (
                <>
                  <div className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-[0.15em] text-ink/65">
                    <span>Shipping</span>
                    <span>${(quote.shippingCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-[0.18em]">
                    <span>Total before tax</span>
                    <span>${(quote.totalCents / 100).toFixed(2)}</span>
                  </div>
                  <p className="mt-4 text-[0.66rem] font-semibold uppercase leading-5 tracking-[0.12em] text-ink/55">
                    {quote.shippingName} {quote.delivery?.minBusinessDays ? `• ${quote.delivery.minBusinessDays}-${quote.delivery.maxBusinessDays} business days after fulfillment` : ''}
                  </p>
                </>
              ) : null}
            </div>

            <form className="mt-8" onSubmit={(event) => { event.preventDefault(); onCalculateShipping(); }}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em]">Shipping estimate</p>
              <div className="mt-4 grid grid-cols-[0.9fr_1.1fr] gap-2">
                <select value={stateCode} onChange={(event) => { setStateCode(event.target.value); onResetQuote(); }} aria-label="U.S. state" autoComplete="address-level1" className="h-12 min-w-0 rounded-none border border-ink/35 bg-transparent px-3 text-sm font-semibold uppercase tracking-[0.12em] outline-none focus:border-ink">
                  <option value="">State</option>
                  {usStates.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
                <input value={zip} onChange={(event) => { setZip(event.target.value.slice(0, 10)); onResetQuote(); }} placeholder="ZIP code" inputMode="numeric" aria-label="ZIP code" autoComplete="postal-code" className="h-12 min-w-0 border border-ink/35 bg-transparent px-3 text-sm font-semibold tracking-[0.1em] outline-none placeholder:text-ink/40 focus:border-ink" />
              </div>
              <button type="submit" disabled={actionStatus !== 'idle'} className="mt-2 h-12 w-full border border-ink bg-transparent text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-ink hover:text-bone disabled:cursor-wait disabled:opacity-60">
                {actionStatus === 'quoting' ? 'Calculating...' : 'Calculate shipping'}
              </button>
            </form>

            {!quote && !actionMessage ? <p className="mt-4 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-ink/55">Enter a U.S. state and ZIP to calculate delivery.</p> : null}
            {actionMessage ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-red-800" role="status">{actionMessage}</p> : null}
            <button type="button" disabled={!quote || actionStatus !== 'idle'} onClick={onCheckout} className="mt-6 min-h-16 w-full bg-ink px-6 text-xs font-black uppercase tracking-[0.25em] text-bone transition hover:bg-bone hover:text-ink hover:outline hover:outline-1 hover:outline-ink disabled:cursor-not-allowed disabled:opacity-35">
              {actionStatus === 'checking-out' ? 'Opening checkout...' : 'Proceed to checkout'}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}

function DropNotice({ message, onExit }) {
  return (
    <main className="grid min-h-screen place-items-center bg-bone px-6 text-ink">
      <div className="max-w-md text-center">
        <p className="brand-mark">{wordmark}</p>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em]">{message}</p>
        <button type="button" onClick={onExit} className="mt-8 border-b border-ink text-xs font-black uppercase tracking-[0.24em]">Return</button>
      </div>
    </main>
  );
}

function EditorialBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(115deg,rgba(13,12,11,0.08),transparent_38%,rgba(13,12,11,0.18))]" />

      <div className="oversize-type left-[4vw] top-[14vh]">NO</div>
      <div className="oversize-type right-[-7vw] top-[10vh] rotate-90">GREE</div>
      <div className="oversize-type bottom-[6vh] left-[18vw] text-[18vw]">ANYBODY</div>

      <div className="absolute -left-16 bottom-0 h-[38vh] w-[92vw] bg-ink/35 shadow-[0_-18px_80px_rgba(13,12,11,0.18)] [clip-path:polygon(0_62%,16%_53%,30%_58%,46%_44%,62%_53%,76%_42%,91%_54%,100%_44%,100%_100%,0_100%)]" />
      <div className="absolute bottom-[13vh] left-[8vw] h-[2px] w-[18vw] rotate-[-7deg] bg-ink/70" />
      <div className="absolute bottom-[18vh] left-[19vw] h-[2px] w-[24vw] rotate-[5deg] bg-bone/40" />

      <div className="collage-shard shard-a" />
      <div className="collage-shard shard-b" />
      <div className="collage-shard shard-c" />

      <div className="absolute inset-0 animate-grain opacity-25 mix-blend-multiply grain" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(233,223,206,0.92)_0%,rgba(233,223,206,0.48)_48%,rgba(13,12,11,0.02)_100%)] lg:bg-[linear-gradient(90deg,rgba(233,223,206,0.96)_0%,rgba(233,223,206,0.72)_48%,rgba(233,223,206,0.08)_100%)]" />

    </div>
  );
}

export default App;
