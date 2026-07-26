import "./HomePage.css";
import "./HomePolish.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "15 min", label: "From link to live session" },
  { value: "6", label: "Distinct roles per team" },
  { value: "4", label: "Timed, compounding rounds" },
  { value: "0", label: "Scores — judgment, not points" },
];

const designedFor = [
  "MBA Programs",
  "Executive Education",
  "Leadership Labs",
  "Case-Method Classrooms",
  "Corporate L&D",
];


const steps = [
  {
    number: "01",
    title: "Get started in 15 minutes",
    desc: "Create a session, share a link, and students join. Each selects a role and receives private context only they can see. The simulation begins when everyone is ready",
  },
  {
    number: "02",
    title: "The simulation runs live",
    desc: "Information arrives in role-specific inboxes across timed rounds. Decisions compound. Faculty can observe and intervene at any moment – no two sessions play out the same way.",
  },
  {
    number: "03",
    title: "AI-powered debrief begins",
    desc: "Decision patterns surface instantly. Students see qualitative outcomes – not scores – and the discussion moves from what happened to why.",
  },
];

const simulators = [
  {
    title: "Judgement in a Crisis: The ANP Phoenix Case",
    status: "LIVE",
    desc: "A firm detects early anomalies in its own systems before anyone has formally reported a problem. Six organizational roles – each with different information and different incentives – must decide what deserves attention before the moment passes.",
    icon: "🏛️",
    active: true,
    tags: [
      "Organizational Behavior",
      "Corporate Governance",
      "Leadership"
    ]
  },
  {
    title: "Supply Chain Under Pressure: The Deccan Logistics Case",
    status: "Coming Q3 2026",
    desc: "A logistics firm. A disruption that hasn't quite become a crisis. Six roles deciding whether to absorb the problem or escalate it - before the client finds out first.",
    icon: "🚀",
    active: false,
    tags: [
      "Operations Management",
      "Supply Chain",
      "Risk"
    ]
  },
  {
    title: "First Mover: The Nira Ventures Case",
    status: "Coming Q4 2026",
    desc: "A first-time founder. Seed funding secured. Three co-founders who agreed on the vision but not on who decides what. The first six months will either build a company-or quietly unravel one.",
    icon: "🌐",
    active: false,
    tags: [
      "Entrepreneurship",
      "Organizational Behavior",
      "Leadership"
    ]
  },
  {
    title: "The Green Mandate: The TarVix Industries Case",
    status: "Coming Q4 2026",
    desc: "A manufacturing firm. A new sustainability commitment made publicly, before anyone inside agreed on what it would actually require. Six roles deciding how much of the business to change - and how fast.",
    icon: "🌱",
    active: false,
    tags: [
      "Sustainability",
      "Strategic Management",
      "Ethics"
    ]
  },
];

const faqs = [
  {
    q: "How long does a session take, and how does it fit into a class schedule?",
    a: "Each simulation runs for approximately two hours across four live rounds. With setup and debrief, the full session fits a three-hour block or a dedicated half-day slot. No pre-reading or multi-week preparation is required; every simulation is designed for single-session deployment.",
  },
  {
    q: "How many students can participate at once?",
    a: "Simulations run in small teams, typically four to six students per team. A class of sixty students runs ten simultaneous teams with no additional setup. The faculty dashboard shows results across all teams in a single view, making large-cohort delivery straightforward.",
  },
  {
    q: "Do I need technical support to run a session?",
    a: "No. Setup takes under fifteen minutes. Students need a device with a browser and a working internet connection — laptops, tablets, or shared lab computers all work. All timing, information delivery, and analytics are handled by the platform automatically.",
  },
  {
    q: "Is there a score or a single correct answer?",
    a: "No. Every simulation ends with qualitative outcomes – not a single correct answer. The outcomes are revealed at the end of the session and used as the starting point for the debrief discussion.",
  },
  {
    q: "What do students see and what remains hidden from them?",
    a: "Each student sees only their own role-specific information. Information is deliberately asymmetric across roles; different players hold different pieces of the picture. This is core to how every simulation on the platform is designed, and it is what makes the post-simulation debrief genuinely revealing",
  },
  {
    q: "Is there faculty support?",
    a: "Every simulation includes a teaching note, a learning outcome map, and a structured debrief guide. We can co-facilitate the session at any institution adopting the platform and provide onboarding support for faculty before their first run",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="logo">
          <span className="logo-biz">CASE</span>
          <span className="logo-sim">RUN</span>
        </div>
        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#about">About</a>
          <a href="#how">How It Works</a>
          <a href="#simulators">Simulations</a>
          <a href="#faq">FAQ</a>
        </div>
        <button
          className="nav-cta"
          onClick={() => document.getElementById("simulators").scrollIntoView({ behavior: "smooth" })}
        >
          Browse Simulations
        </button>
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
              Multi-Role AI-Powered Business Simulations
            </div>
            <h1>
              Where business judgment is learned,<br />
              <span className="hero-accent">not just studied.</span>
            </h1>
            <p className="hero-sub">
              Role-based business simulations where information is never complete, consequences 
              compound, and AI turns every debrief into a structured learning moment.
            </p>
            <div className="hero-buttons">
              <button
                className="btn-primary btn-lg"
                onClick={() => document.getElementById("simulators").scrollIntoView({ behavior: "smooth" })}
              >
                Browse Simulations
                <span className="btn-arrow">→</span>
              </button>
              <button className="btn-ghost btn-lg">Schedule Demo</button>
            </div>
            <div className="hero-trust">
              <span>No pre-reading required</span>
              <span>Runs in any browser</span>
              <span>Built for the case method</span>
            </div>
          </div>

          <div className="hero-right reveal reveal-delay">
            <div className="video-wrapper">
              <div className="video-badge">Live Demo</div>
              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/xt9s48_k0ak"
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
            <div className="stat-item" key={i}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DESIGNED FOR */}
      <section className="partners">
        <div className="container">
          <div className="partners-label">Designed for</div>
          <div className="partners-strip">
            {designedFor.map((p, i) => (
              <span className="partner-logo" key={i}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about">
        <div className="container about-inner">
          <div className="about-left reveal">
            <div className="section-eyebrow" style={{fontSize : '18px'}}>What caserun does</div>
            
            <p>
              CaseRun builds simulations that put students inside decisions that are still forming. 
              Each simulation places a team of students in different organizational roles, with different 
              information, different accountabilities, and different pressures. They must act – or choose 
              not to - as the situation evolves across multiple live rounds. 
              </p>
              <p>
              There are no scores. No single correct answer. Outcomes accumulate from the decisions 
              made, and are revealed at the end of the session.
              AI-powered analytics then read the decision patterns across all teams – so faculty spend the 
              debrief discussing what happened, not computing it.
            </p>
            <button
              className="btn-primary"
              onClick={() => document.getElementById("simulators").scrollIntoView({ behavior: "smooth" })}
            >
              Browse Simulations →
            </button>
          </div>

          <div className="about-right reveal reveal-delay">
            <div className="feature-grid">
              {[
                { icon: "🎭", title: "Role-based asymmetric information", desc: "Every student holds a different piece of the picture. What the team collectively knows is always more than what any one person sees – and that gap is where the learning lives." },
                { icon: "⚡", title: "Consequences that compound", desc: "Early decisions shape what is possible in later rounds. Students experience – not just read about – how choices made under uncertainty close future options." },
                { icon: "🤝", title: "No single correct answer", desc: "Outcomes are qualitative, what unfolds depends on the decisions made. And the debrief is where the learning becomes permanent." },
                { icon: "📊", title: "AI-powered debrief analytics", desc: "AI analytics engine reads decision patterns in real-time across all teams. Class-level insights and a suggested opening question are ready the moment the simulation ends." },
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
            <h2>How It Works</h2>
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
            <div className="section-eyebrow" style={{ fontSize: "24px" }}>Simulations</div>
            
          </div>

          <div className="simulator-grid">
            {simulators.map((sim, i) => (
              <div className={`sim-card ${sim.active ? "active" : "disabled"} reveal`} key={i}>
                <div className="sim-icon">{sim.icon}</div>
              <span
                className={`sim-badge ${
                  sim.status === "LIVE" ? "badge-live" : "badge-soon"
                }`}
              >
                {sim.status === "LIVE" ? "● LIVE" : sim.status}
              </span>

              <h3>{sim.title}</h3>

              <p>{sim.desc}</p>
                              
                <div className="sim-tags">
                {sim.tags.map((tag, idx) => (
                  <span key={idx} className="sim-tag">
                    {tag}
                  </span>
                ))}
              </div>

              {sim.active && (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
    <span style={{ fontSize: "13px", color: "#c9a84c" }}>⏱ 2 hours</span>
    <span style={{ fontSize: "13px", color: "#c9a84c" }}>👥 6 players per team</span>
    <span style={{ fontSize: "13px", color: "#c9a84c" }}>🔄 4 rounds</span>
  </div>
)}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="faq-section">
        <div className="container faq-inner">
          <div className="faq-left reveal">
            <div className="section-eyebrow">FAQ</div>
            <h2>Common Questions</h2>
            <p>Everything you need to know before bringing CaseRun to your institution.</p>
            <a href="mailto:hello@caserun.in" className="btn-ghost btn-sm faq-contact">
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
            <h2>Take Caserun into your classroom</h2>
            <p>We are opening access to faculty at Indian business schools who want to run a full simulation session co-facilitated and fully supported. Tell us about your course and we will take it from there.</p>
          </div>
          <div className="cta-actions">
            <button className="btn-ghost-white btn-lg">Schedule Demo</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="logo footer-logo">
              <span className="logo-biz">CASE</span>
              <span className="logo-sim">RUN</span>
            </div>
            <p>The decisions your students make in the next two hours will follow them for the rest of their careers</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <div className="footer-heading">Product</div>
              <a href="#simulators">Simulations</a>
              <a href="#how">How It Works</a>
              <a href="#about">About</a>
            </div>
            
            <div className="footer-col">
              <div className="footer-heading">Contact</div>
              <a href="mailto:hello@caserun.in">hello@caserun.in</a>
              <a href="#">Book a Demo</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <span>© 2026 CaseRun. All rights reserved.</span>
            <span>Privacy Policy · Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
