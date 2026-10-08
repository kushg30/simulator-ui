import { useEffect, useLayoutEffect } from "react";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import { getSimulation } from "./simulationCatalogue";
import "./HomePage.css"; // nav, footer, container and button styles are defined there
import "./SimulationProductPage.css";

/**
 * The product page for one simulation — the page a prospective buyer is sent to.
 *
 * Order follows what someone evaluating a simulation actually needs, in the order they need it:
 * what it is, what happens in it, what it teaches, what you get, how it runs, how long it takes,
 * and how to get access.
 */
export default function SimulationProductPage() {
  const { slug } = useParams();
  const sim = getSimulation(slug);

  // Land at the top with no visible travel.
  //
  // Two things made the naive version look wrong. HomePolish.css sets a global
  // `html { scroll-behavior: smooth }`, so a plain scrollTo(0, 0) animates the entire way up from
  // wherever the card was clicked — you watch the homepage scroll past. And useEffect runs after
  // paint, so the new page was briefly drawn at the old scroll offset first. An explicit
  // "instant" in a layout effect fixes both: it overrides the CSS and happens before the frame.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [slug]);

  useEffect(() => {
    if (sim) document.title = `${sim.shortTitle} — CaseRun`;
    return () => { document.title = "CaseRun"; };
  }, [slug, sim]);

  if (!sim) {
    return (
      <div className="homepage simpage">
        <nav className="navbar scrolled">
          <Link to="/" className="logo simpage-logo">
            <span className="logo-biz">CASE</span>
            <span className="logo-sim">RUN</span>
          </Link>
        </nav>
        <div className="container simpage-missing">
          <h1>Simulation not found</h1>
          <p>That simulation doesn’t exist, or isn’t published yet.</p>
          <Link className="btn-primary btn-lg" to="/#simulators">Browse simulations</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const access = (
    <div className="simpage-cta-card">
      <h3>Bring this to your cohort</h3>
      <p>
        Pricing is set per institution, based on cohort size and how many times you plan to run it
        across the year. Tell us your batch size and timing and we’ll come back with a quote and a
        facilitator walkthrough.
      </p>
      <div className="simpage-cta-row">
        <a
          className="btn-primary btn-lg"
          href={`mailto:hello@caserun.in?subject=${encodeURIComponent(
            `Access request — ${sim.shortTitle}`
          )}&body=${encodeURIComponent(
            `Institution:\nProgramme / course:\nApproximate batch size:\nWhen you'd like to run it:\n\nAnything else we should know:`
          )}`}
        >
          Request access
        </a>
        <a className="btn-ghost btn-lg" href="mailto:hello@caserun.in?subject=Book%20a%20walkthrough">
          Book a walkthrough
        </a>
      </div>
    </div>
  );

  return (
    <div className="homepage simpage">
      {/* Minimal nav: this page is a destination for a specific link, not a browsing surface. */}
      <nav className="navbar scrolled">
        <Link to="/" className="logo simpage-logo">
          <span className="logo-biz">CASE</span>
          <span className="logo-sim">RUN</span>
        </Link>
        <Link to="/#simulators" className="simpage-back">← All simulations</Link>
      </nav>

      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <header className="simpage-hero">
        <div className="container simpage-hero-inner">
          <div>
            <div className="simpage-badges">
              <span className="simpage-status">{sim.status}</span>
              {sim.tags.map((t) => (
                <span className="sim-tag" key={t}>{t}</span>
              ))}
            </div>
            <h1 className="simpage-title">{sim.title}</h1>
            <p className="simpage-tagline">{sim.tagline}</p>
            <div className="simpage-facts">
              {sim.facts.map(([value, label]) => (
                <div key={label}><b>{value}</b><span>{label}</span></div>
              ))}
            </div>
          </div>

          {sim.video ? (
            <div className="simpage-video">
              <iframe
                src={sim.video}
                title={`${sim.shortTitle} — overview`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="simpage-video simpage-video-empty">
              <span className="simpage-video-icon">{sim.icon}</span>
              <span>Walkthrough video coming soon — book a live walkthrough below.</span>
            </div>
          )}
        </div>
      </header>

      <div className="container simpage-body">
        {/* ── overview ────────────────────────────────────────────────────── */}
        <section className="simpage-sec">
          <h2>Overview</h2>
          {sim.overview.map((p, i) => <p key={i} className="simpage-prose">{p}</p>)}
        </section>

        {/* ── story ───────────────────────────────────────────────────────── */}
        <section className="simpage-sec">
          <h2>The situation</h2>
          {sim.story.map((p, i) => <p key={i} className="simpage-prose">{p}</p>)}
        </section>

        {/* ── core components ─────────────────────────────────────────────── */}
        <section className="simpage-sec">
          <h2>Core components</h2>
          <div className="simpage-cards">
            {sim.components.map(([name, desc]) => (
              <div className="simpage-card" key={name}>
                <h4>{name}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── learning objectives ─────────────────────────────────────────── */}
        <section className="simpage-sec">
          <h2>Learning objectives</h2>
          <p className="simpage-sub">By the end of the debrief, participants should be able to:</p>
          <ul className="simpage-objectives">
            {sim.objectives.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </section>

        {/* ── what's included ─────────────────────────────────────────────── */}
        <section className="simpage-sec">
          <h2>What’s included</h2>
          <dl className="simpage-dl">
            {sim.included.map(([name, desc]) => (
              <div key={name}><dt>{name}</dt><dd>{desc}</dd></div>
            ))}
          </dl>
        </section>

        {/* ── format + duration, side by side ─────────────────────────────── */}
        <section className="simpage-sec">
          <div className="simpage-split">
            <div>
              <h2>Multiplayer format</h2>
              <p className="simpage-prose">{sim.multiplayer}</p>
            </div>
            <div>
              <h2>Duration</h2>
              <dl className="simpage-dl simpage-dl-tight">
                {sim.durations.map(([name, desc]) => (
                  <div key={name}><dt>{name}</dt><dd>{desc}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── access ──────────────────────────────────────────────────────── */}
        <section className="simpage-sec simpage-sec-cta">
          {access}
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
