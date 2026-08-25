import "./HomePage.css";
import "./HomePolish.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { warmup } from "../config";


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
    duration: "2 hours",
    players: "6 players per team",
    rounds: "4 rounds",
    tags: [
      "Organizational Behavior",
      "Corporate Governance",
      "Leadership"
    ]
  },
  {
    title: "Can the Board Trust This? The Meridian Retail Case",
    status: "LIVE",
    desc: "A fast-growing retailer, days from a Board meeting, with a revenue number Finance and Strategy can't reconcile. Five analytics roles must turn a raw, unchecked data feed into numbers the Board can trust — where an early miss quietly follows the team to the end.",
    icon: "📊",
    active: true,
    demo: "/demo",
    duration: "90 minutes",
    players: "5 players per team",
    rounds: "5 rounds",
    tags: [
      "Data Analytics",
      "Business Intelligence",
      "Decision-Making"
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

// ── Student voices (from the post-session feedback forms) ────────────────────
const VOICE_STATS = [
  { value: "118", label: "students played" },
  { value: "4.8", suffix: "/5", label: "average experience" },
  { value: "83%", label: "rated it 5 out of 5" },
  { value: "100%", label: "want more simulations" },
];

// Photo testimonials — put images at public/testimonials/<file>. Missing photos
// fall back to an initials avatar, so this renders fine before the images land.
const TESTIMONIALS = [
  { name: "Krishna Patel", role: "Member of Placement Cell, SIBM'28", photo: "/testimonials/krishna.jpg", quote: "A fun and engaging experience that helped me understand management decision-making through teamwork — I enjoyed contributing to decisions even when I wasn't leading a department." },
  { name: "Ananya Kumar", role: "Member of Corporate Council, SIBM'28", photo: "/testimonials/ananya.jpg", quote: "The simulation was challenging and something completely new." },
  { name: "Asmita Chowdhury", role: "MBA Student, SIBM'28", photo: "/testimonials/asmita.jpg", quote: "Very insightful, and genuinely fun to work under pressure." },
  { name: "Siri Ciroori", role: "MBA Student, SIBM'28", photo: "/testimonials/siri.jpg", quote: "Insightful — I loved the teamwork and the coordination it took." },
  { name: "Himanshi Bahal", role: "MBA Student, SIBM'28", photo: "/testimonials/himanshi.jpg", quote: "Playing with the data and figuring out exactly what went wrong." },
  { name: "Abhinav Nair", role: "Core Member, MINT Finance Club, SIBM'28", photo: "/testimonials/abhinav.jpg", quote: "Excellent simulation — I'd love more problems like this to stress-test our thinking." },
  { name: "Aditya Sachan", role: "Member, Career Assistance Team, SIBM'28", photo: "/testimonials/aditya.jpg", quote: "It was amazing." },
];

// Anonymous written highlights from the experience survey.
const VOICE_QUOTES = [
  "Seeing how raw, messy data could be transformed into clear insights and real business decisions.",
  "I felt like I was really an employee working in the company, doing my job.",
  "A genuinely fun, unique and thoughtfully designed experience — you could see the effort that went into it.",
  "Very interactive, with real-life problems that tested us. I hope to have more simulations going ahead.",
  "Knowing a concept is one thing; applying it in practice is what we're really looking for.",
  "Turning raw data into a clear insight — and a decision that can actually be defended.",
];

// Gallery — put session photos at public/gallery/1.jpg, 2.jpg, … Missing files hide themselves.
const GALLERY = Array.from({ length: 9 }, (_, i) => `/gallery/${i + 1}.jpg`);

const initials = (n) =>
  (n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function HomePage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeT, setActiveT] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [galleryOk, setGalleryOk] = useState({}); // index -> true once the image loads
  const observerRef = useRef(null);

  // Auto-advance the testimonial carousel (pauses on hover).
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setActiveT((i) => (i + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(id);
  }, [paused]);

  // Warm the backend as soon as anyone lands on the site, so the first
  // create/join later in the flow doesn't pay the cold-start cost.
  useEffect(() => {
    warmup();
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const goTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

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
          <a href="#voices">Voices</a>
          <a href="#gallery">Gallery</a>
          <a href="#faq">FAQ</a>
        </div>
        <button className="nav-cta" onClick={() => goTo("simulators")}>
          Browse Simulations
        </button>
        <button
          className={`nav-burger ${menuOpen ? "open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
        <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
          <a onClick={() => setMenuOpen(false)} href="#">Home</a>
          <a onClick={() => goTo("about")}>About</a>
          <a onClick={() => goTo("how")}>How It Works</a>
          <a onClick={() => goTo("simulators")}>Simulations</a>
          <a onClick={() => goTo("voices")}>Voices</a>
          <a onClick={() => goTo("gallery")}>Gallery</a>
          <a onClick={() => goTo("faq")}>FAQ</a>
          <button className="btn-primary btn-lg" onClick={() => goTo("simulators")}>
            Browse Simulations
          </button>
        </div>
      </div>

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
    <span style={{ fontSize: "13px", color: "#c9a84c" }}>⏱ {sim.duration}</span>
    <span style={{ fontSize: "13px", color: "#c9a84c" }}>👥 {sim.players}</span>
    <span style={{ fontSize: "13px", color: "#c9a84c" }}>🔄 {sim.rounds}</span>
  </div>
)}

              {sim.demo && (
                <a href={sim.demo} className="sim-demo-link">Try a 2-minute sample round →</a>
              )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDENT VOICES */}
      <section id="voices" className="voices">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-eyebrow" style={{ fontSize: "24px" }}>Student experience</div>
            <h2>What students say</h2>
          </div>

          {/* credibility stats */}
          <div className="voice-stats reveal">
            {VOICE_STATS.map((s, i) => (
              <div className="voice-stat" key={i}>
                <div className="voice-stat-value">
                  {s.value}
                  {s.suffix && <span>{s.suffix}</span>}
                </div>
                <div className="voice-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* photo testimonial carousel */}
          <div
            className="voice-carousel reveal"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="voice-viewport">
              <div
                className="voice-track"
                style={{ transform: `translateX(-${activeT * 100}%)` }}
              >
                {TESTIMONIALS.map((t, i) => (
                  <div className="voice-slide" key={i} aria-hidden={i !== activeT}>
                    <div className="voice-avatar">
                      <span>{initials(t.name)}</span>
                      {t.photo && (
                        <img
                          src={t.photo}
                          alt={t.name}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </div>
                    <blockquote>“{t.quote}”</blockquote>
                    <div className="voice-name">{t.name}</div>
                    <div className="voice-role">{t.role}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="voice-arrow prev"
              aria-label="Previous testimonial"
              onClick={() => setActiveT((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
            >
              ‹
            </button>
            <button
              className="voice-arrow next"
              aria-label="Next testimonial"
              onClick={() => setActiveT((i) => (i + 1) % TESTIMONIALS.length)}
            >
              ›
            </button>
          </div>
          <div className="voice-dots">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`voice-dot ${i === activeT ? "on" : ""}`}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => setActiveT(i)}
              />
            ))}
          </div>

          {/* written quote wall */}
          <div className="voice-quotes-head reveal">
            <div className="section-eyebrow">Participant feedback highlights</div>
            <p className="voice-quotes-sub">
              Symbiosis Institute of Business &amp; Management, Hyderabad · MBA 2026–28
            </p>
          </div>
          <div className="voice-quotes reveal">
            {VOICE_QUOTES.map((q, i) => (
              <div className="voice-quote" key={i}>
                <p>“{q}”</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SESSION GALLERY */}
      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-eyebrow">Gallery</div>
            <h2>Moments from the room</h2>
            <p>Teams working through the Meridian Retail case — live, together, under the clock.</p>
          </div>
          <div className="gallery-grid reveal">
            {GALLERY.map((src, i) => (
              <button
                key={i}
                className="gallery-tile"
                style={{ display: galleryOk[i] ? "block" : "none" }}
                onClick={() => setLightbox(src)}
                aria-label={`Open session photo ${i + 1}`}
              >
                <img
                  src={src}
                  alt={`Session moment ${i + 1}`}
                  onLoad={() => setGalleryOk((g) => ({ ...g, [i]: true }))}
                  onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }}
                />
                <span className="gallery-tile-overlay" aria-hidden="true">⤢</span>
              </button>
            ))}
          </div>
        </div>

        {lightbox && (
          <div className="voice-lightbox" onClick={() => setLightbox(null)}>
            <button className="voice-lightbox-close" aria-label="Close">×</button>
            <img src={lightbox} alt="Enlarged session view" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
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
