import { useState } from 'react';

const backgroundWords = ['NO GREE', 'LAGOS', 'DROP 01', 'NO EXCUSES'];
const wordmark = 'no\u00b7gree';

function App() {
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

      const result = await response.json();

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-bone text-ink selection:bg-ink selection:text-bone">
      <EditorialBackground />

      <section className="relative z-10 flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between text-sm font-black uppercase tracking-[0.22em] sm:text-base">
          <a href="/" className="brand-mark tracking-normal" aria-label="no·gree home">
            {wordmark}
          </a>
          <p className="date-stamp">07.01.26</p>
        </header>

        <div className="relative grid flex-1 items-center gap-12 pb-8 pt-16 lg:grid-cols-1 lg:pt-10">
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
