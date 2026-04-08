import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const moduleCards = useMemo(
    () =>
      modules.map((module) => (
        <article
          key={module.name}
          className="group rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
        >
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-700 transition-colors duration-300 group-hover:bg-slate-800 group-hover:text-white">
            <i className={`bi ${module.icon}`} aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900">{module.name}</h3>
          <p className="mt-2 text-base text-slate-600">{module.description}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors duration-300 group-hover:text-slate-800">
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
          className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/92 p-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-30px_rgba(15,23,42,0.55)]"
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-xl text-amber-700">
            <i className={`bi ${benefit.icon}`} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{benefit.title}</h3>
          <p className="mt-2 text-slate-600">{benefit.description}</p>
        </article>
      )),
    []
  );

  const brandPillarCards = useMemo(
    () =>
      brandPillars.map((pillar) => (
        <article
          key={pillar.title}
          className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.42)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.5)]"
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-xl text-sky-700">
            <i className={`bi ${pillar.icon}`} aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{pillar.title}</h3>
          <p className="mt-2 text-slate-600">{pillar.text}</p>
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
    <div className="h-screen overflow-y-auto bg-slate-100">
      <section id="home" className="relative isolate overflow-hidden bg-gradient-to-b from-[#0f2556] to-[#162e65] px-6 pb-16 pt-6 sm:px-10 lg:px-20 lg:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(circle at 22% 18%, rgba(235, 182, 55, 0.24), transparent 32%), radial-gradient(circle at 85% 84%, rgba(255, 255, 255, 0.12), transparent 35%)',
          }}
        />

        <header className="relative z-20 mx-auto max-w-6xl">
          <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur sm:px-6">
            <button
              type="button"
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-3 text-left"
            >
              <img src="/dermas-logo.png" alt="Dermas Apparel" className="h-10 w-10 object-contain" />
              <div>
                <p className="text-xs tracking-[0.2em] text-slate-300">DERMAS</p>
                <p className="text-sm font-semibold text-white sm:text-base">Dermas Apparel ERP</p>
              </div>
            </button>

            <div className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
              <button type="button" onClick={() => scrollToSection('home')} className="transition-colors hover:text-white">Home</button>
              <button type="button" onClick={() => scrollToSection('features')} className="transition-colors hover:text-white">Features</button>
              <button type="button" onClick={() => scrollToSection('about')} className="transition-colors hover:text-white">About</button>
              <button type="button" onClick={() => scrollToSection('contact')} className="transition-colors hover:text-white">Contact</button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              Login
            </button>
          </nav>
        </header>

        <div className="relative z-10 mx-auto mt-14 grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-200">
              <i className="bi bi-stars" aria-hidden="true" />
              Unified Garment ERP
            </span>

            <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
              Welcome to <span className="text-amber-400">Dermas Apparel</span> ERP
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200 sm:text-xl">
              A centralized platform built to support garment manufacturing, purchasing, inventory,
              employees, and business operations with better visibility and control.
            </p>

            <div className="mt-6 grid max-w-xl gap-2 text-left text-sm text-slate-100 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <i className="bi bi-check2-circle mt-0.5 text-amber-300" aria-hidden="true" />
                <span>Premium garment manufacturing identity</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="bi bi-check2-circle mt-0.5 text-amber-300" aria-hidden="true" />
                <span>Production visibility across teams</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="bi bi-check2-circle mt-0.5 text-amber-300" aria-hidden="true" />
                <span>Integrated department management</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="bi bi-check2-circle mt-0.5 text-amber-300" aria-hidden="true" />
                <span>Better decision-making through ERP</span>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl bg-amber-400 px-10 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-xl"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="rounded-xl border border-white/30 bg-white/10 px-10 py-4 text-lg font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-white/20"
              >
                Explore Features
              </button>
            </div>
          </div>

          <aside className="mx-auto w-full max-w-lg rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="overflow-hidden rounded-2xl border border-slate-300/20 bg-slate-900/30">
              <div className="relative">
                <img
                  src="/welcomepage-img/factory-3.png"
                  alt="Dermas garment manufacturing floor"
                  className="h-64 w-full object-cover object-[48%_34%] sm:hidden"
                  fetchPriority="high"
                  decoding="async"
                />
                <img
                  src="/welcomepage-img/factory-2.png"
                  alt="Dermas garment manufacturing floor"
                  className="hidden h-60 w-full object-cover object-[50%_38%] sm:block lg:hidden"
                  decoding="async"
                />
                <img
                  src="/welcomepage-img/factory-1.png"
                  alt="Dermas garment manufacturing floor"
                  className="hidden h-56 w-full object-cover object-[52%_42%] lg:block"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/15 bg-slate-900/55 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Export Manufacturing</p>
                  <p className="mt-1 text-sm font-semibold text-white">Business-focused ERP for apparel operations</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-300">Live Jobs</p>
                  <p className="mt-1 text-2xl font-semibold text-white">128</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-300">On-Time Rate</p>
                  <p className="mt-1 text-2xl font-semibold text-white">96%</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-300">Active Orders</p>
                  <p className="mt-1 text-2xl font-semibold text-white">74</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-300">Material Alerts</p>
                  <p className="mt-1 text-2xl font-semibold text-white">5</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="features" className="px-6 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Everything You Need in One Place</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600 sm:text-xl">
            Streamline every aspect of your garment manufacturing business with integrated modules.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {moduleCards}
        </div>
      </section>

      <section className="px-6 pb-10 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">End-to-End Factory Workflow</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Production-Focused Operations</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Centralized Business Control</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trust Highlight</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">Organized Department Coordination</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Our Factory
            </span>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Modern Manufacturing
              <span className="block text-slate-700">Built for Scale</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Our purpose-built factory in Bandarawela runs on premium JUKI industrial sewing machines,
              operated by a trained workforce of 100+ skilled garment professionals.
            </p>

            <ul className="mt-7 space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-emerald-600" aria-hidden="true" />
                <span>50+ JUKI industrial sewing machines</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-emerald-600" aria-hidden="true" />
                <span>Dedicated cutting, sewing &amp; QC floors</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-emerald-600" aria-hidden="true" />
                <span>Multi-stage quality inspection process</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-emerald-600" aria-hidden="true" />
                <span>Scalable capacity for bulk orders</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="bi bi-check2-circle mt-1 text-emerald-600" aria-hidden="true" />
                <span>On-time delivery commitment</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Explore Our Factory
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                  src="/welcomepage-img/factory-4.png"
                  alt="Dermas production floor"
                  className="h-44 w-full object-cover sm:h-48"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                  src="/welcomepage-img/factory-1.png"
                  alt="Garment team in sewing line"
                  className="h-44 w-full object-cover sm:h-48"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                  src="/welcomepage-img/factory-3.png"
                  alt="JUKI machines in active production"
                  className="h-44 w-full object-cover sm:h-48"
                  decoding="async"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
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

      <section id="about" className="relative isolate overflow-hidden bg-slate-50 px-6 py-20 sm:px-10 lg:px-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <img
            src="/welcomepage-img/flag.webp"
            alt=""
            className="h-full w-full object-cover object-[55%_38%] opacity-[0.08] saturate-50 blur-[2px]"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/94 via-white/92 to-slate-50/95" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Built for Garment Operations</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Why Dermas Apparel ERP: a business-first platform designed for premium manufacturing operations.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
            {benefitCards}
          </div>

          <div className="mt-14 rounded-3xl border border-slate-200/85 bg-white/92 p-7 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.55)] sm:p-9">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dermas Apparel Identity</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Strong branding with a professional industry tone</h3>
                <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
                  Purpose-built for export-oriented garment businesses that require quality-focused workflow,
                  centralized operations, and connected decision-making from factory floor to management.
                </p>
              </div>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
                <img src="/welcomepage-img/logo.png" alt="Dermas brand mark" className="h-16 w-16 object-contain" />
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
              {brandPillarCards}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-slate-50/70 px-6 py-20 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">
              <i className="bi bi-dot" aria-hidden="true" />
              Find Us
            </span>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Visit Our Factory</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Connect with Dermas Apparel operations and business support from our Bandarawela manufacturing location.
            </p>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-red-400 via-red-500 to-blue-500" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
            <article className="group flex h-full flex-col rounded-3xl border border-slate-200/85 bg-white/95 p-7 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.52)]">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-xl text-rose-600">
                <i className="bi bi-geo-alt" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Address</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-slate-900 sm:text-2xl">
                Kolathenna, Heeloya Road,<br />
                Bandarawela 90100
              </p>
              <a
                href="https://maps.google.com/?q=Kolathenna%2C%20Heeloya%20Road%2C%20Bandarawela%2090100"
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold uppercase tracking-wide text-rose-600 transition-colors hover:text-rose-700"
              >
                View on Map
                <i className="bi bi-arrow-right transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-slate-200/85 bg-white/95 p-7 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.52)]">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-xl text-blue-600">
                <i className="bi bi-clock" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Working Hours</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-slate-900 sm:text-2xl">Monday - Saturday</p>
              <p className="mt-1 text-lg text-slate-600">Open - Closes 5:00 PM</p>
              <p className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Currently Open
              </p>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-slate-200/85 bg-white/95 p-7 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(15,23,42,0.52)]">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-xl text-rose-600">
                <i className="bi bi-telephone" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Phone</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-slate-900 sm:text-2xl">+94 78 200 0479</p>
              <p className="mt-1 text-lg text-slate-600">+94 77 103 9230</p>
              <a
                href="tel:+94782000479"
                className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold uppercase tracking-wide text-rose-600 transition-colors hover:text-rose-700"
              >
                Call Now
                <i className="bi bi-arrow-right transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </article>

            <article className="group flex h-full flex-col rounded-3xl border border-red-300/55 bg-gradient-to-br from-red-500 via-red-500 to-red-400 p-7 text-white shadow-[0_16px_34px_-26px_rgba(220,38,38,0.42)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_38px_-24px_rgba(220,38,38,0.48)]">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-xl text-white">
                <i className="bi bi-envelope" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-100">Business Enquiries</p>
              <p className="mt-3 text-xl leading-snug font-semibold text-white sm:text-2xl">Looking to partner with us?</p>
              <p className="mt-1 text-lg text-red-100">Get export pricing &amp; samples</p>
              <a
                href="mailto:contact@dermasapparel.com?subject=Business%20Enquiry"
                className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-white/50 bg-white/95 px-4 py-3 text-sm font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-white"
              >
                Get a Quote
                <i className="bi bi-arrow-right ml-2 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </article>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-12 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xl font-semibold text-slate-900">Dermas Apparel ERP</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                A centralized business platform built to streamline garment factory operations, improve visibility,
                and support better coordination across departments.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Quick Links</p>
              <div className="mt-4 flex flex-col items-start gap-2 text-sm text-slate-600">
                <button type="button" onClick={() => scrollToSection('home')} className="transition-colors hover:text-slate-900">Home</button>
                <button type="button" onClick={() => scrollToSection('features')} className="transition-colors hover:text-slate-900">Features</button>
                <button type="button" onClick={() => scrollToSection('about')} className="transition-colors hover:text-slate-900">About</button>
                <button type="button" onClick={() => scrollToSection('contact')} className="transition-colors hover:text-slate-900">Contact</button>
                <button type="button" onClick={() => navigate('/login')} className="transition-colors hover:text-slate-900">Login</button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">ERP Modules</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
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
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Support / Contact</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>Kolathenna, Heeloya Road, Bandarawela 90100, Sri Lanka</li>
                <li>Monday - Saturday: 8:00 AM - 5:00 PM</li>
                <li>+94 78 200 0479</li>
                <li>+94 77 103 9230</li>
                <li>
                  <a href="mailto:contact@dermasapparel.com" className="text-slate-700 underline-offset-2 transition-colors hover:text-slate-900 hover:underline">
                    contact@dermasapparel.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">
            <p>© 2026 Dermas Apparel ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
