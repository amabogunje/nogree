import { useEffect, useState } from 'react';

const backgroundWords = ['NO GREE', 'LAGOS', 'DROP 01', 'NO EXCUSES'];
const wordmark = 'no\u00b7gree';

function App() {
  const [view, setView] = useState(() => window.location.hash === '#drop-01' ? 'drop' : 'landing');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleRegister(event) {
    event.preventDefault();

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { error: 'Registration endpoint is not available. Try refreshing the page.' };

      if (!response.ok) {
        throw new Error(result.error || 'Could not save registration.');
      }

      setEmail('');
      setStatus('success');
      setMessage('Registered.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Could not save registration.');
    }
  }

  function openDrop() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.hash = 'drop-01';
    window.history.replaceState({}, '', url);
    setView('drop');
  }

  function closeDrop() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.hash = '';
    window.history.replaceState({}, '', url);
    setView('landing');
  }

  const checkoutState = new URLSearchParams(window.location.search).get('checkout');

  if (checkoutState === 'success' || checkoutState === 'cancelled') {
    return <CheckoutReturn state={checkoutState} onContinue={checkoutState === 'success' ? openDrop : closeDrop} />;
  }

  if (view === 'drop') {
    return <DropShop onExit={closeDrop} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bone text-ink selection:bg-ink selection:text-bone">
      <EditorialBackground />

      <section className="relative z-10 flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between text-sm font-black uppercase tracking-[0.22em] sm:text-base">
          <a href="/" className="brand-mark tracking-normal" aria-label="no·gree home">
            {wordmark}
          </a>
          <button
            type="button"
            onClick={openDrop}
            className="date-stamp border-b border-ink pb-1 text-xs transition hover:border-transparent sm:text-sm"
          >
            Drop 01
          </button>
        </header>

        <div className="relative grid flex-1 items-center gap-0 pb-8 pt-16 lg:grid-cols-1 lg:gap-12 lg:pt-10">
          <div className="relative z-20 max-w-4xl">
            <p className="animate-reveal text-xs font-black uppercase tracking-[0.62em] text-smoke/70 [animation-delay:120ms]">
              Collection 01
            </p>

            <h1 className="hero-word mt-5 animate-reveal text-[clamp(4.5rem,16vw,13.5rem)] lowercase leading-[0.75] [animation-delay:220ms]">
              {wordmark}
            </h1>

            <div className="mt-12 max-w-3xl animate-reveal [animation-delay:340ms]">
              <p className="tagline text-balance text-xl font-black uppercase leading-[1.9] tracking-[0.34em] sm:text-2xl">
                Emotional language from Lagos
                <br />
                Worn with resistance.
              </p>

              <div className="mt-10 h-px w-20 bg-ink" />

              <div className="mt-9 uppercase">
                <p className="text-sm font-black tracking-[0.42em] text-smoke/75">Launching</p>
                <p className="mt-3 text-2xl font-black tracking-[0.36em] sm:text-3xl">
                  July 1, 2026
                </p>
              </div>
            </div>

            <form
              className="relative z-30 mt-12 flex w-full max-w-xl animate-reveal flex-col border border-ink/55 bg-bone/90 shadow-[0_18px_60px_rgba(13,12,11,0.18)] backdrop-blur-sm [animation-delay:460ms] sm:h-[4.5rem] sm:flex-row"
              onSubmit={handleRegister}
            >
              <label className="sr-only" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
                className="min-h-16 flex-1 bg-transparent px-7 text-base tracking-[0.16em] text-ink outline-none placeholder:text-ink/45"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="group relative min-h-16 overflow-hidden bg-ink px-7 text-xs font-black uppercase tracking-[0.28em] text-bone transition duration-300 hover:bg-bone hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bone sm:min-w-60"
              >
                <span className="absolute inset-0 origin-left scale-x-0 bg-bone transition-transform duration-300 group-hover:scale-x-100" />
                <span className="relative">
                  {status === 'submitting' ? 'Registering...' : 'Register for Class'}
                </span>
              </button>
            </form>
            {message ? (
              <p
                className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-ink/70"
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            ) : null}
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

        <footer className="relative z-20 pb-2 text-center text-xs font-black uppercase tracking-[0.5em] text-bone mix-blend-difference sm:text-left">
          First drop coming soon.
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
            ? 'Your payment is confirmed. We are preparing your order for fulfillment.'
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

function DropShop({ onExit }) {
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
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

        const firstProduct = result.products[0];
        const firstVariant = firstProduct.variants.find((variant) => variant.available);
        setProduct(firstProduct);
        setSelectedColor(firstVariant?.color || '');
        setSelectedSize(firstVariant?.size || '');
      } catch (error) {
        if (active) setLoadError(error.message || 'Could not load Drop 01.');
      }
    }

    loadDrop();
    return () => {
      active = false;
    };
  }, []);

  if (loadError) {
    return <DropNotice message={loadError} onExit={onExit} />;
  }

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

  function resetQuote() {
    setQuote(null);
    setActionMessage('');
  }

  function chooseColor(color) {
    const nextSize = product.variants.find((variant) => variant.available && variant.color === color)?.size || '';
    setSelectedColor(color);
    setSelectedSize(nextSize);
    resetQuote();
  }

  async function calculateShipping() {
    if (!selectedVariant) return;

    setActionStatus('quoting');
    setActionMessage('');

    try {
      const response = await fetch('/api/shipping-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ variantId: selectedVariant.id, quantity }],
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
    if (!selectedVariant || !quote) return;

    setActionStatus('checking-out');
    setActionMessage('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ variantId: selectedVariant.id, quantity }],
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

  return (
    <main className="min-h-screen bg-bone text-ink selection:bg-ink selection:text-bone">
      <header className="flex items-center justify-between border-b border-ink/25 px-6 py-6 sm:px-10 lg:px-16">
        <button type="button" onClick={onExit} className="brand-mark" aria-label="Return to no·gree home">
          {wordmark}
        </button>
        <p className="text-xs font-black uppercase tracking-[0.34em]">Drop 01</p>
        <button type="button" onClick={onExit} className="text-xs font-black uppercase tracking-[0.24em] underline underline-offset-4">
          Exit
        </button>
      </header>

      <section className="grid min-h-[calc(100vh-5.7rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(25rem,0.88fr)]">
        <div className="relative flex min-h-[54vh] items-center justify-center overflow-hidden bg-[#d9d0c0] px-7 py-14 sm:px-14 lg:min-h-0 lg:px-20">
          <div className="pointer-events-none absolute inset-0 opacity-20 grain mix-blend-multiply" />
          <p className="pointer-events-none absolute left-[5%] top-[7%] font-display text-[clamp(5rem,15vw,14rem)] leading-none text-ink/5">01</p>
          <img
            src={selectedColorImage || product.imageUrl}
            alt={`${product.name} in ${selectedColor}`}
            className="relative z-10 h-auto max-h-[72vh] w-full max-w-2xl object-contain mix-blend-multiply"
          />
          <p className="absolute bottom-7 left-7 z-10 text-[0.62rem] font-black uppercase tracking-[0.34em] sm:bottom-10 sm:left-10">
            Emotional language from Lagos
          </p>
        </div>

        <section className="flex flex-col border-t border-ink/25 px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-14 lg:py-14">
          <div>
            <p className="text-[0.66rem] font-black uppercase tracking-[0.4em] text-ink/55">{product.collection}</p>
            <h1 className="mt-4 logo-serif text-5xl leading-none sm:text-6xl">{product.name}</h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-ink/70">{product.description}</p>
            <p className="mt-7 text-lg font-black tracking-[0.08em]">${(itemTotal / 100).toFixed(2)}</p>
          </div>

          <div className="mt-11 border-t border-ink/25 pt-8">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.32em]">Color</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => chooseColor(color)}
                  className={`border px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${selectedColor === color ? 'border-ink bg-ink text-bone' : 'border-ink/35 hover:border-ink'}`}
                >
                  {color}
                </button>
              ))}
            </div>

            <p className="mt-8 text-[0.65rem] font-black uppercase tracking-[0.32em]">Size</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setSelectedSize(size); resetQuote(); }}
                  className={`h-12 border text-xs font-black uppercase tracking-[0.16em] transition ${selectedSize === size ? 'border-ink bg-ink text-bone' : 'border-ink/35 hover:border-ink'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-ink/25 pt-8">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.32em]">Quantity</p>
                <div className="mt-4 flex h-12 border border-ink/35">
                  <button type="button" onClick={() => { setQuantity(Math.max(1, quantity - 1)); resetQuote(); }} className="w-12 text-lg hover:bg-ink hover:text-bone" aria-label="Decrease quantity">-</button>
                  <output className="grid w-12 place-items-center border-x border-ink/35 text-sm font-black">{quantity}</output>
                  <button type="button" onClick={() => { setQuantity(Math.min(10, quantity + 1)); resetQuote(); }} className="w-12 text-lg hover:bg-ink hover:text-bone" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <p className="max-w-44 text-right text-[0.63rem] font-black uppercase leading-5 tracking-[0.18em] text-ink/55">
                U.S. orders only
              </p>
            </div>

            <p className="mt-8 text-[0.65rem] font-black uppercase tracking-[0.32em]">Shipping estimate</p>
            <div className="mt-4 grid grid-cols-[0.8fr_1.2fr] gap-2">
              <input
                value={stateCode}
                onChange={(event) => { setStateCode(event.target.value.toUpperCase().slice(0, 2)); resetQuote(); }}
                placeholder="State"
                aria-label="U.S. state code"
                className="h-12 min-w-0 border border-ink/35 bg-transparent px-4 text-sm font-black uppercase tracking-[0.16em] outline-none placeholder:text-ink/40 focus:border-ink"
              />
              <input
                value={zip}
                onChange={(event) => { setZip(event.target.value.slice(0, 10)); resetQuote(); }}
                placeholder="ZIP code"
                inputMode="numeric"
                aria-label="ZIP code"
                className="h-12 min-w-0 border border-ink/35 bg-transparent px-4 text-sm font-black tracking-[0.12em] outline-none placeholder:text-ink/40 focus:border-ink"
              />
            </div>
            <button
              type="button"
              onClick={calculateShipping}
              disabled={actionStatus !== 'idle'}
              className="mt-2 h-12 w-full border border-ink bg-transparent text-xs font-black uppercase tracking-[0.24em] transition hover:bg-ink hover:text-bone disabled:cursor-wait disabled:opacity-60"
            >
              {actionStatus === 'quoting' ? 'Calculating...' : 'Calculate shipping'}
            </button>
          </div>

          <div className="mt-6 border-y border-ink py-5">
            <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em]">
              <span>Selection</span>
              <span>${(itemTotal / 100).toFixed(2)}</span>
            </div>
            {quote ? (
              <>
                <div className="mt-3 flex justify-between text-xs font-black uppercase tracking-[0.14em] text-ink/65">
                  <span>Shipping</span>
                  <span>${(quote.shippingCents / 100).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between text-xs font-black uppercase tracking-[0.2em]">
                  <span>Total before tax</span>
                  <span>${(quote.totalCents / 100).toFixed(2)}</span>
                </div>
                <p className="mt-4 text-[0.62rem] font-black uppercase leading-5 tracking-[0.14em] text-ink/55">
                  {quote.shippingName} {quote.delivery?.minBusinessDays ? `• ${quote.delivery.minBusinessDays}-${quote.delivery.maxBusinessDays} business days after fulfillment` : ''}
                </p>
              </>
            ) : null}
          </div>

          {actionMessage ? <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-red-800" role="status">{actionMessage}</p> : null}
          <button
            type="button"
            disabled={!quote || actionStatus !== 'idle'}
            onClick={startCheckout}
            className="mt-6 min-h-16 w-full bg-ink px-6 text-xs font-black uppercase tracking-[0.28em] text-bone transition hover:bg-bone hover:text-ink hover:outline hover:outline-1 hover:outline-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            {actionStatus === 'checking-out' ? 'Opening checkout...' : 'Proceed to checkout'}
          </button>
        </section>
      </section>
    </main>
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

      <div className="absolute left-8 top-[34vh] hidden rotate-[-90deg] gap-5 text-[0.65rem] font-black uppercase tracking-[0.42em] text-ink/40 lg:flex">
        {backgroundWords.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
    </div>
  );
}

export default App;
