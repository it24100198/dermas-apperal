import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import heroFactoryImage from '../assets/flag.webp';

const modules = [
  { name: 'Expenses', description: 'Track and manage costs', icon: 'bi-currency-dollar' },
  { name: 'Employees', description: 'HR and payroll management', icon: 'bi-people' },
  { name: 'Purchasing', description: 'Procurement workflow', icon: 'bi-cart3' },
  { name: 'Manufacturing', description: 'Production tracking', icon: 'bi-building-gear' },
  { name: 'Stock Control', description: 'Inventory management', icon: 'bi-box-seam' },
  { name: 'Sales and POS', description: 'Point of sale system', icon: 'bi-bar-chart' },
  { name: 'Order Tracking', description: 'Fulfillment and delivery', icon: 'bi-truck' },
];

const benefits = [
  {
    title: 'Centralized Operations Across Departments',
    description: 'Connect purchasing, inventory, production, quality, and finance in one operational workflow.',
    icon: 'bi-diagram-3',
  },
  {
    title: 'Production and Inventory Visibility',
    description: 'Track live work-in-progress, stock movement, and fulfillment status with clear operational context.',
    icon: 'bi-activity',
  },
  {
    title: 'Streamlined Supplier Workflows',
    description: 'Standardize purchasing and supplier coordination to reduce delays and keep factory schedules stable.',
    icon: 'bi-binoculars',
  },
  {
    title: 'Faster Reporting and Decisions',
    description: 'Use connected data across departments to make informed decisions faster and with greater control.',
    icon: 'bi-lightning-charge',
  },
];

const brandPillars = [
  {
    title: 'Premium Garment Manufacturing',
    text: 'Built for apparel production teams focused on quality output and reliable delivery.',
    icon: 'bi-award',
  },
  {
    title: 'Centralized Factory Operations',
    text: 'Coordinate departments through one ERP platform instead of disconnected tools.',
    icon: 'bi-building',
  },
  {
    title: 'Quality-Focused Workflow',
    text: 'Align production, checks, and handovers with standardized process visibility.',
    icon: 'bi-shield-check',
  },
  {
    title: 'Integrated Business Control',
    text: 'Support better decision-making with unified operational and financial data.',
    icon: 'bi-graph-up-arrow',
  },
];

export default function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const moduleCards = useMemo(
    () =>
      modules.map((module) => (
        <article
          key={module.name}
          className="group rounded-2xl border border-white/10 bg-[#314C8A]/24 p-6 shadow-[0_18px_36px_-30px_rgba(2,8,24,0.8)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/14 hover:bg-[#314C8A]/32 hover:shadow-[0_24px_42px_-28px_rgba(2,8,24,0.9)]"
        >
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0E2A6D] text-2xl text-[#F4BE2A] shadow-[0_10px_22px_-16px_rgba(244,190,42,0.35)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#1D3F91] group-hover:text-[#F8FAFC] group-hover:shadow-[0_14px_26px_-16px_rgba(244,190,42,0.34)]">
            <i className={`bi ${module.icon}`} aria-hidden="true" />
          </div>
          <h3 className="text-[1.35rem] font-semibold leading-snug text-[#F8FAFC]">{module.name}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#D6DEEE]">{module.description}</p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#A9B7D3] transition-all duration-300 group-hover:gap-2.5 group-hover:text-[#F4BE2A]">
            View module
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </div>
        </article>
      )),
    []
  );

  const benefitCards = useMemo(
    () =>
      benefits.map((benefit) => (
        <article
          key={benefit.title}
          className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#314C8A]/26 p-7 shadow-[0_20px_40px_-30px_rgba(2,8,24,0.82)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/14 hover:bg-[#314C8A]/34"
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0E2A6D] text-xl text-[#F4BE2A] shadow-[0_10px_20px_-14px_rgba(244,190,42,0.3)]">
            <i className={`bi ${benefit.icon}`} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-[#F8FAFC]">{benefit.title}</h3>
          <p className="mt-2 text-[#D6DEEE]">{benefit.description}</p>
        </article>
      )),
    []
  );

  const brandPillarCards = useMemo(
    () =>
      brandPillars.map((pillar) => (
        <article
          key={pillar.title}
          className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#314C8A]/22 p-7 shadow-[0_18px_36px_-30px_rgba(2,8,24,0.82)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/14 hover:bg-[#314C8A]/30"
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0E2A6D] text-xl text-[#F4BE2A] shadow-[0_10px_20px_-14px_rgba(244,190,42,0.3)]">
            <i className={`bi ${pillar.icon}`} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-[#F8FAFC]">{pillar.title}</h3>
          <p className="mt-2 text-[#D6DEEE]">{pillar.text}</p>
        </article>
      )),
    []
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-700">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-b from-[#0A1B4D] via-[#0E2A6D] to-[#0A1B4D]">
      <section id="home" className="relative isolate overflow-hidden bg-gradient-to-br from-[#071634] via-[#0A1B4D] to-[#0E2A6D] px-6 pb-16 pt-6 sm:px-10 lg:px-20 lg:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            background:
              'radial-gradient(circle at 18% 16%, rgba(244, 190, 42, 0.26), transparent 30%), radial-gradient(circle at 84% 78%, rgba(29, 63, 145, 0.38), transparent 36%), radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05), transparent 24%)',
          }}
        />

        <header
          className={`relative z-20 mx-auto max-w-6xl transition-all duration-700 ease-out ${heroReady ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}
        >
          <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0A1B4D]/78 px-4 py-3 shadow-[0_18px_38px_-24px_rgba(2,8,24,0.78)] backdrop-blur-md sm:px-6">
            <button
              type="button"
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-3 text-left"
            >
              <img src="/dermas-logo.png" alt="Dermas Apparel" className="h-10 w-10 object-contain" />
              <div>
                <p className="text-xs tracking-[0.2em] text-[#D6DEEE]">DERMAS</p>
                <p className="text-sm font-semibold text-[#F8FAFC] sm:text-base">Dermas Apparel ERP</p>
              </div>
            </button>

            <div className="hidden items-center gap-6 text-sm text-[#D6DEEE] md:flex">
              <button type="button" onClick={() => scrollToSection('home')} className="transition-colors hover:text-[#F8FAFC] hover:drop-shadow-[0_0_10px_rgba(244,190,42,0.18)]">Home</button>
              <button type="button" onClick={() => scrollToSection('features')} className="transition-colors hover:text-[#F8FAFC] hover:drop-shadow-[0_0_10px_rgba(244,190,42,0.18)]">Features</button>
              <button type="button" onClick={() => scrollToSection('about')} className="transition-colors hover:text-[#F8FAFC] hover:drop-shadow-[0_0_10px_rgba(244,190,42,0.18)]">About</button>
              <button type="button" onClick={() => scrollToSection('contact')} className="transition-colors hover:text-[#F8FAFC] hover:drop-shadow-[0_0_10px_rgba(244,190,42,0.18)]">Contact</button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-lg border border-[#F4BE2A]/70 bg-gradient-to-r from-[#F4BE2A] to-[#D9A91A] px-4 py-2 text-sm font-semibold text-[#0A1B4D] shadow-[0_14px_28px_-16px_rgba(244,190,42,0.9)] transition-all hover:-translate-y-0.5 hover:brightness-105"
            >
              Login
            </button>
          </nav>
        </header>

        <div className="relative z-10 mx-auto mt-14 grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div
            className={`rounded-[2rem] border border-white/10 bg-[#0A1B4D]/68 p-7 text-center shadow-[0_30px_55px_-34px_rgba(3,8,24,0.82)] backdrop-blur-md transition-all duration-700 delay-100 ease-out lg:p-10 lg:text-left ${heroReady ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0E2A6D]/88 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#F4BE2A] shadow-[0_10px_24px_-18px_rgba(244,190,42,0.35)]">
              <i className="bi bi-stars" aria-hidden="true" />
              UNIFIED GARMENT ERP
            </span>

            <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-[#F8FAFC] sm:text-6xl xl:text-7xl">
              Welcome to <span className="text-[#F4BE2A]">Dermas Apparel</span> ERP
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#D6DEEE] sm:text-lg">
              A premium ERP platform for garment manufacturing, production visibility, and operational control.
            </p>

            <div className="mt-7 grid max-w-xl gap-3 text-left text-sm text-[#D6DEEE] sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8 hover:shadow-[0_10px_20px_-16px_rgba(244,190,42,0.22)]">
                <i className="bi bi-check2-circle mt-0.5 text-[#F4BE2A]" aria-hidden="true" />
                <span>Premium garment manufacturing identity</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8 hover:shadow-[0_10px_20px_-16px_rgba(244,190,42,0.22)]">
                <i className="bi bi-check2-circle mt-0.5 text-[#F4BE2A]" aria-hidden="true" />
                <span>Production visibility across teams</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8 hover:shadow-[0_10px_20px_-16px_rgba(244,190,42,0.22)]">
                <i className="bi bi-check2-circle mt-0.5 text-[#F4BE2A]" aria-hidden="true" />
                <span>Integrated department management</span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/8 hover:shadow-[0_10px_20px_-16px_rgba(244,190,42,0.22)]">
                <i className="bi bi-check2-circle mt-0.5 text-[#F4BE2A]" aria-hidden="true" />
                <span>Better decision-making through ERP</span>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-2xl bg-gradient-to-r from-[#F4BE2A] to-[#D9A91A] px-10 py-4 text-lg font-semibold text-[#0A1B4D] shadow-[0_18px_30px_-14px_rgba(244,190,42,0.82)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_36px_-16px_rgba(244,190,42,0.9)] hover:brightness-105"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="rounded-2xl border border-white/14 bg-white/8 px-10 py-4 text-lg font-semibold text-[#F8FAFC] shadow-[0_16px_28px_-20px_rgba(2,8,24,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/12 hover:shadow-[0_18px_30px_-18px_rgba(255,255,255,0.12)]"
              >
                Explore Features
              </button>
            </div>
          </div>

          <aside
            className={`mx-auto w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0E2A6D]/40 p-5 shadow-[0_30px_55px_-34px_rgba(2,8,24,0.9)] backdrop-blur-md transition-all duration-700 delay-200 ease-out ${heroReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
          >
            <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0A1B4D]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="overflow-hidden border-b border-white/10">
                <img
                  src={heroFactoryImage}
                  alt="Factory operations"
                  className="block h-[18rem] w-full object-cover sm:h-[20rem] lg:h-[21rem]"
                  style={{ opacity: 1, visibility: 'visible' }}
                />
              </div>
              <div className="px-4 pb-1 pt-3">
                <div className="rounded-xl border border-white/10 bg-[#0A1B4D]/68 px-4 py-3 shadow-[0_14px_28px_-18px_rgba(2,8,24,0.8)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#F4BE2A]">Export Manufacturing</p>
                  <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">Business-focused ERP for apparel operations</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="rounded-xl border border-white/10 bg-[#314C8A]/34 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/14 hover:bg-[#314C8A]/42">
                  <p className="text-[11px] uppercase tracking-wider text-[#A9B7D3]">Live Jobs</p>
                  <p className="mt-1 text-3xl font-semibold leading-none text-[#F8FAFC]">128</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#314C8A]/34 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/14 hover:bg-[#314C8A]/42">
                  <p className="text-[11px] uppercase tracking-wider text-[#A9B7D3]">On-Time Rate</p>
                  <p className="mt-1 text-3xl font-semibold leading-none text-[#F8FAFC]">96%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#314C8A]/34 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/14 hover:bg-[#314C8A]/42">
                  <p className="text-[11px] uppercase tracking-wider text-[#A9B7D3]">Active Orders</p>
                  <p className="mt-1 text-3xl font-semibold leading-none text-[#F8FAFC]">74</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#314C8A]/34 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/14 hover:bg-[#314C8A]/42">
                  <p className="text-[11px] uppercase tracking-wider text-[#A9B7D3]">Material Alerts</p>
                  <p className="mt-1 text-3xl font-semibold leading-none text-[#F8FAFC]">5</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="features" className="px-6 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-[#f8fafc] sm:text-5xl">Everything You Need in One Place</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-[#d6deee] sm:text-xl">
            Streamline every aspect of your garment manufacturing business with integrated modules.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {moduleCards}
        </div>
      </section>

      <section className="px-6 pb-10 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#314C8A]/20 p-6 shadow-[0_20px_40px_-30px_rgba(2,8,24,0.75)] backdrop-blur-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0E2A6D]/60 p-4 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.65)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A9B7D3]">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">End-to-End Factory Workflow</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0E2A6D]/60 p-4 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.65)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A9B7D3]">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">Production-Focused Operations</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0E2A6D]/60 p-4 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.65)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A9B7D3]">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">Centralized Business Control</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0E2A6D]/60 p-4 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.65)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A9B7D3]">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">Organized Department Coordination</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#0E2A6D] to-[#0A1B4D] px-6 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-[#314c8a]/36 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4be2a]">
              Our Factory
            </span>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-[#f8fafc] sm:text-5xl">
              Modern Manufacturing
              <span className="block text-[#d6deee]">Built for Scale</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#d6deee]">
              Our purpose-built factory in Bandarawela runs on premium JUKI industrial sewing machines,
              operated by a trained workforce of 100+ skilled garment professionals.
            </p>

            <ul className="mt-7 space-y-3 text-[#d6deee]">
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-[#f4be2a]" aria-hidden="true" />
                <span>50+ JUKI industrial sewing machines</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-[#f4be2a]" aria-hidden="true" />
                <span>Dedicated cutting, sewing &amp; QC floors</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-[#f4be2a]" aria-hidden="true" />
                <span>Multi-stage quality inspection process</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-[#f4be2a]" aria-hidden="true" />
                <span>Scalable capacity for bulk orders</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-[#f4be2a]" aria-hidden="true" />
                <span>On-time delivery commitment</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f4be2a] to-[#d9a91a] px-6 py-3 text-sm font-semibold text-[#0a1b4d] transition-all hover:-translate-y-0.5 hover:brightness-105"
            >
              Explore Our Factory
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#314C8A]/22 p-4 shadow-[0_20px_42px_-28px_rgba(2,8,24,0.78)] backdrop-blur-sm sm:p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E2A6D]/55 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.55)]">
                <img
                  src="/welcomepage-img/factory-4.png"
                  alt="Dermas production floor"
                  className="h-44 w-full object-cover sm:h-48"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E2A6D]/55 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.55)]">
                <img
                  src="/welcomepage-img/factory-1.png"
                  alt="Garment team in sewing line"
                  className="h-44 w-full object-cover sm:h-48"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E2A6D]/55 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.55)]">
                <img
                  src="/welcomepage-img/factory-3.png"
                  alt="JUKI machines in active production"
                  className="h-44 w-full object-cover sm:h-48"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E2A6D]/55 shadow-[0_12px_24px_-18px_rgba(2,8,24,0.55)]">
                <img
                  src="/welcomepage-img/factory-2.png"
                  alt="Factory team and workflow operations"
                  className="h-44 w-full object-cover sm:h-48"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative isolate overflow-hidden bg-gradient-to-b from-[#0A1B4D] to-[#0E2A6D] px-6 py-20 sm:px-10 lg:px-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <img
            src="/welcomepage-img/flag.webp"
            alt=""
            className="h-full w-full object-cover object-[55%_38%] opacity-[0.06] saturate-50 blur-[2px]"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1B4D]/92 via-[#0E2A6D]/94 to-[#0A1B4D]/95" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-[#f8fafc] sm:text-5xl">Built for Garment Operations</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-[#d6deee] sm:text-xl">
              Why Dermas Apparel ERP: a business-first platform designed for premium manufacturing operations.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
            {benefitCards}
          </div>

          <div className="mt-14 rounded-3xl border border-white/10 bg-[#314C8A]/18 p-7 shadow-[0_24px_50px_-34px_rgba(2,8,24,0.82)] backdrop-blur-sm sm:p-9">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9b7d3]">Dermas Apparel Identity</p>
                <h3 className="mt-2 text-2xl font-bold text-[#f8fafc] sm:text-3xl">Strong branding with a professional industry tone</h3>
                <p className="mt-4 max-w-3xl leading-relaxed text-[#d6deee]">
                  Purpose-built for export-oriented garment businesses that require quality-focused workflow,
                  centralized operations, and connected decision-making from factory floor to management.
                </p>
              </div>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0E2A6D]/60 shadow-sm backdrop-blur-sm">
                <img src="/welcomepage-img/logo.png" alt="Dermas brand mark" className="h-16 w-16 object-contain" />
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
              {brandPillarCards}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-gradient-to-b from-[#0E2A6D] to-[#0A1B4D] px-6 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#314c8a]/35 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f4be2a]">
              <i className="bi bi-dot" aria-hidden="true" />
              Find Us
            </span>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-[#f8fafc] sm:text-5xl">Visit Our Factory</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#d6deee] sm:text-lg">
              Connect with Dermas Apparel operations and business support from our Bandarawela manufacturing location.
            </p>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-[#f4be2a] via-[#d9a91a] to-[#1d3f91]" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
            <article className="group flex h-full flex-col rounded-3xl border border-white/10 bg-[#314C8A]/24 p-7 shadow-[0_20px_40px_-30px_rgba(2,8,24,0.78)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/14 hover:bg-[#314C8A]/30">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0E2A6D] text-xl text-[#F4BE2A] shadow-[0_10px_20px_-14px_rgba(244,190,42,0.3)]">
                <i className="bi bi-geo-alt" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a9b7d3]">Address</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-[#f8fafc] sm:text-2xl">
                Kolathenna, Heeloya Road,<br />
                Bandarawela 90100
              </p>
              <a
                href="https://maps.google.com/?q=Kolathenna%2C%20Heeloya%20Road%2C%20Bandarawela%2090100"
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold uppercase tracking-wide text-[#f4be2a] transition-colors hover:text-[#f8fafc]"
              >
                View on Map
                <i className="bi bi-arrow-right transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-white/10 bg-[#314C8A]/24 p-7 shadow-[0_20px_40px_-30px_rgba(2,8,24,0.78)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/14 hover:bg-[#314C8A]/30">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0E2A6D] text-xl text-[#F4BE2A] shadow-[0_10px_20px_-14px_rgba(244,190,42,0.3)]">
                <i className="bi bi-clock" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a9b7d3]">Working Hours</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-[#f8fafc] sm:text-2xl">Monday - Saturday</p>
              <p className="mt-1 text-lg text-[#d6deee]">Open - Closes 5:00 PM</p>
              <p className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-[#f4be2a]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f4be2a]" />
                Currently Open
              </p>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-white/10 bg-[#314C8A]/24 p-7 shadow-[0_20px_40px_-30px_rgba(2,8,24,0.78)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/14 hover:bg-[#314C8A]/30">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0E2A6D] text-xl text-[#F4BE2A] shadow-[0_10px_20px_-14px_rgba(244,190,42,0.3)]">
                <i className="bi bi-telephone" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a9b7d3]">Phone</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-[#f8fafc] sm:text-2xl">+94 78 200 0479</p>
              <p className="mt-1 text-lg text-[#d6deee]">+94 77 103 9230</p>
              <a
                href="tel:+94782000479"
                className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold uppercase tracking-wide text-[#f4be2a] transition-colors hover:text-[#f8fafc]"
              >
                Call Now
                <i className="bi bi-arrow-right transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-[#F4BE2A]/35 bg-gradient-to-br from-[#0A1B4D] via-[#0E2A6D] to-[#1D3F91] p-7 text-white shadow-[0_22px_44px_-24px_rgba(2,8,24,0.85)] transition-all duration-300 hover:-translate-y-1 hover:brightness-105">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#F4BE2A]/35 bg-[#F4BE2A]/10 text-xl text-[#F4BE2A] shadow-[0_10px_20px_-14px_rgba(244,190,42,0.28)]">
                <i className="bi bi-envelope" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4be2a]">Business Enquiries</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-white sm:text-2xl">Looking to partner with us?</p>
              <p className="mt-1 text-lg text-[#d6deee]">Get export pricing &amp; samples</p>
              <a
                href="mailto:contact@dermasapparel.com?subject=Business%20Enquiry"
                className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-[#f4be2a]/55 bg-gradient-to-r from-[#f4be2a] to-[#d9a91a] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#0a1b4d] transition-all hover:brightness-105"
              >
                Get a Quote
                <i className="bi bi-arrow-right ml-2 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </article>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0A1B4D] px-6 py-12 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xl font-semibold text-[#f8fafc]">Dermas Apparel ERP</p>
              <p className="mt-3 text-sm leading-relaxed text-[#d6deee]">
                A centralized business platform built to streamline garment factory operations, improve visibility,
                and support better coordination across departments.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#f4be2a]">Quick Links</p>
              <div className="mt-4 flex flex-col items-start gap-2 text-sm text-[#d6deee]">
                <button type="button" onClick={() => scrollToSection('home')} className="transition-colors hover:text-[#f8fafc]">Home</button>
                <button type="button" onClick={() => scrollToSection('features')} className="transition-colors hover:text-[#f8fafc]">Features</button>
                <button type="button" onClick={() => scrollToSection('about')} className="transition-colors hover:text-[#f8fafc]">About</button>
                <button type="button" onClick={() => scrollToSection('contact')} className="transition-colors hover:text-[#f8fafc]">Contact</button>
                <button type="button" onClick={() => navigate('/login')} className="transition-colors hover:text-[#f8fafc]">Login</button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#f4be2a]">ERP Modules</p>
              <ul className="mt-4 space-y-2 text-sm text-[#d6deee]">
                <li>Expenses</li>
                <li>Employees</li>
                <li>Purchasing</li>
                <li>Manufacturing</li>
                <li>Stock Control</li>
                <li>Sales &amp; POS</li>
                <li>Order Tracking</li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#f4be2a]">Support / Contact</p>
              <ul className="mt-4 space-y-2 text-sm text-[#d6deee]">
                <li>Kolathenna, Heeloya Road, Bandarawela 90100, Sri Lanka</li>
                <li>Monday - Saturday: 8:00 AM - 5:00 PM</li>
                <li>+94 78 200 0479</li>
                <li>+94 77 103 9230</li>
                <li>
                  <a href="mailto:contact@dermasapparel.com" className="text-[#f8fafc] underline-offset-2 transition-colors hover:text-[#f4be2a] hover:underline">
                    contact@dermasapparel.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/12 pt-5 text-sm text-[#a9b7d3]">
            <p>© 2026 Dermas Apparel ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
