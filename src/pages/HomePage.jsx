import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "500+", label: "MBA Students" },
  { value: "20+", label: "Live Scenarios" },
  { value: "95%", label: "Satisfaction Rate" },
  { value: "40+", label: "Partner Institutions" },
];

const steps = [
  {
    number: "01",
    title: "Choose Your Role",
    desc: "Step into a CEO, CFO, CMO, or Operations lead role within a simulated company.",
  },
  {
    number: "02",
    title: "Make Decisions",
    desc: "Navigate real business challenges — budgets, crises, market shifts — with limited information.",
  },
  {
    number: "03",
    title: "See Consequences",
    desc: "Watch your decisions ripple through the business in real-time analytics and feedback.",
  },
];

const simulators = [
  {
    title: "Corporate Strategy",
    status: "LIVE",
    desc: "Manage a company across all functions and compete in a dynamic, evolving market.",
    icon: "🏛️",
    active: true,
  },
  {
    title: "Startup Launchpad",
    status: "SOON",
    desc: "Build your startup from idea to Series A and pitch to a panel of investors.",
    icon: "🚀",
    active: false,
  },
  {
    title: "Global Markets",
    status: "SOON",
    desc: "Navigate international supply chains, forex risk, and geopolitical economics.",
    icon: "🌐",
    active: false,
  },
  {
    title: "Sustainability Challenge",
    status: "SOON",
    desc: "Lead ESG-focused transformation and measure impact beyond profit.",
    icon: "🌱",
    active: false,
  },
];

const faqs = [
  {
    q: "Who is BizSimulate designed for?",
    a: "BizSimulate is built specifically for MBA programs, executive education, and business school faculty who want to give students experiential, decision-based learning.",
  },
  {
    q: "How many students can participate simultaneously?",
    a: "Our platform supports cohorts of up to 500 students in parallel sessions. Enterprise plans support unlimited concurrent users.",
  },
  {
    q: "Can faculty customize the simulations?",
    a: "Yes. Faculty get a dedicated dashboard to configure market conditions, adjust difficulty, assign roles, and track individual performance analytics.",
  },
  {
    q: "Is there an LMS integration?",
    a: "We integrate with Canvas, Blackboard, Moodle, and most major LMS platforms via LTI 1.3.",
  },
];

const partners = ["Harvard", "Wharton", "INSEAD", "LBS", "ISB", "NUS", "IE", "Kellogg"];

export default function HomePage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="homepage">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-biz">BIZ</span>
          <span className="logo-sim">SIMULATE</span>
        </div>
        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#about">About</a>
          <a href="#how">How It Works</a>
          <a href="#simulators">Simulators</a>
          <a href="#faq">FAQ</a>
        </div>
        
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid"></div>
          <div className="hero-orb orb1"></div>
          <div className="hero-orb orb2"></div>
        </div>

        <div className="container hero-inner">
          <div className="hero-left reveal">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot"></span>
              MBA Business Simulation Platform
            </div>
            <h1>
              Experience Business.<br />
              <span className="hero-accent">Lead the Future.</span>
            </h1>
            <p className="hero-sub">
              Role-based simulations designed for top business schools. Master decision-making,
              strategic thinking, and leadership through consequences that feel real.
            </p>
            <div className="hero-buttons">
              <button
                className="btn-primary btn-lg"
                onClick={() => document.getElementById("simulators").scrollIntoView({ behavior: "smooth" })}
              >
                Explore Simulators
                <span className="btn-arrow">→</span>
              </button>
              <button className="btn-ghost btn-lg">Request Demo</button>
            </div>
          </div>

          <div className="hero-right reveal reveal-delay">
            <div className="video-wrapper">
              <div className="video-badge">Live Demo</div>
              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/yvmsUcHEuKM"
                  title="Simulation Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="container stats-inner">
          {stats.map((s, i) => (
            <div className="stat-item reveal" key={i}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PARTNERS STRIP */}
      <section className="partners">
        <div className="container">
          <p className="partners-label">Trusted by leading business schools worldwide</p>
          <div className="partners-strip">
            {partners.map((p, i) => (
              <div className="partner-logo" key={i}>{p}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about">
        <div className="container about-inner">
          <div className="about-left reveal">
            <div className="section-eyebrow">About the Platform</div>
            <h2>Bridging Theory<br />and Practice</h2>
            <p>
              Traditional case studies tell you what happened. BizSimulate puts you in the room
              where it happens. Students step into C-suite roles, face real-time pressure, and
              discover how their decisions shape outcomes — before they ever enter a boardroom.
            </p>
            <button
              className="btn-primary"
              onClick={() => document.getElementById("simulators").scrollIntoView({ behavior: "smooth" })}
            >
              See Simulations →
            </button>
          </div>

          <div className="about-right reveal reveal-delay">
            <div className="feature-grid">
              {[
                { icon: "🎭", title: "Role-Based Learning", desc: "Step into real executive roles with distinct responsibilities and information sets." },
                { icon: "⚡", title: "Real-World Scenarios", desc: "Curated from actual Fortune 500 case studies and crisis events." },
                { icon: "🤝", title: "Team Collaboration", desc: "Multi-player rounds that require cross-functional negotiation and alignment." },
                { icon: "📊", title: "Analytics & Insights", desc: "Detailed post-round dashboards showing decision impact and learning gaps." },
              ].map((f, i) => (
                <div className="feature-card" key={i}>
                  <div className="feature-icon">{f.icon}</div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="how-it-works">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-eyebrow">Process</div>
            <h2>How It Works</h2>
            <p>From onboarding to debrief in three structured phases.</p>
          </div>

          <div className="steps-row">
            {steps.map((step, i) => (
              <div className="step-card reveal" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < steps.length - 1 && <div className="step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATORS */}
      <section id="simulators" className="simulators">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-eyebrow">Simulations</div>
            <h2>Choose Your Simulation</h2>
            <p>Each module is a self-contained learning experience with distinct roles and challenges.</p>
          </div>

          <div className="simulator-grid">
            {simulators.map((sim, i) => (
              <div className={`sim-card ${sim.active ? "active" : "disabled"} reveal`} key={i}>
                <div className="sim-icon">{sim.icon}</div>
                <div className="sim-header">
                  <h3>{sim.title}</h3>
                  <span className={`sim-badge ${sim.status === "LIVE" ? "badge-live" : "badge-soon"}`}>
                    {sim.status === "LIVE" ? "● LIVE" : "Coming Soon"}
                  </span>
                </div>
                <p>{sim.desc}</p>
                {sim.active ? (
                  <button className="btn-primary btn-sm" onClick={() => navigate("/context")}>
                    Enter Simulator →
                  </button>
                ) : (
                  <button className="btn-ghost btn-sm" disabled>Notify Me</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="testimonial-section">
        <div className="container">
          <div className="testimonial-card reveal">
            <div className="quote-mark">"</div>
            <p className="quote-text">
              This simulation transformed how our MBA students understand leadership.
              The debrief analytics alone are worth it — we finally have data on decision quality,
              not just outcomes.
            </p>
            <div className="quote-author">
              <div className="author-avatar">P</div>
              <div>
                <div className="author-name">Prof. Anjali Mehta</div>
                <div className="author-role">Associate Dean, Strategy — IIM Ahmedabad</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section">
        <div className="container faq-inner">
          <div className="faq-left reveal">
            <div className="section-eyebrow">FAQ</div>
            <h2>Common Questions</h2>
            <p>Everything you need to know before bringing BizSimulate to your institution.</p>
            <a href="mailto:hello@bizsimulate.com" className="btn-ghost btn-sm faq-contact">
              Still have questions? Contact us →
            </a>
          </div>

          <div className="faq-right reveal reveal-delay">
            {faqs.map((faq, i) => (
              <div className={`faq-item ${openFaq === i ? "open" : ""}`} key={i}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <span className="faq-icon">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <div className="faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="container cta-inner reveal">
          <div className="cta-text">
            <h2>Ready to Transform Business Education?</h2>
            <p>Join 40+ institutions already using BizSimulate in their MBA curriculum.</p>
          </div>
          <div className="cta-actions">
            <button className="btn-white btn-lg" onClick={() => navigate("/")}>Start Free Trial</button>
            <button className="btn-ghost-white btn-lg">Schedule Demo</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="logo footer-logo">
              <span className="logo-biz">BIZ</span>
              <span className="logo-sim">SIMULATE</span>
            </div>
            <p>Experiential business education for the next generation of leaders.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <div className="footer-heading">Product</div>
              <a href="#simulators">Simulations</a>
              <a href="#how">How It Works</a>
              <a href="#about">About</a>
            </div>
            <div className="footer-col">
              <div className="footer-heading">Company</div>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Press</a>
            </div>
            <div className="footer-col">
              <div className="footer-heading">Contact</div>
              <a href="mailto:hello@bizsimulate.com">hello@bizsimulate.com</a>
              <a href="#">Book a Demo</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <span>© 2026 BizSimulate. All rights reserved.</span>
            <span>Privacy Policy · Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
