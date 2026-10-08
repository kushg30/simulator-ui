/**
 * Content for the per-simulation product pages.
 *
 * Kept apart from the page component so the homepage card and the product page read from one
 * source and cannot disagree about duration, team size or round count — the three things a
 * prospective buyer checks first.
 *
 * `price` is deliberately absent for now: nothing is published until a number is decided. The page
 * renders a request-access block in its place, which is also how a college actually buys (invoice
 * and PO, not a card on a pricing page).
 */

export const SIMULATIONS = [
  {
    slug: "phoenix-ai-judgment",
    title: "When Can You Trust Your AI? The ANP Phoenix Case",
    shortTitle: "Phoenix AI Judgment",
    status: "LIVE",
    icon: "🤖",
    tags: ["Responsible AI", "AI Governance", "Leadership Judgment"],

    facts: [
      ["60 min", "of play"],
      ["6", "roles per team"],
      ["4", "timed rounds"],
    ],

    video: "https://www.youtube.com/embed/k3IqrQ7j-Ms",

    tagline:
      "An AI system flagged something it cannot explain. No customer complained. No money was lost. Nothing is technically wrong — and that is the problem.",

    overview: [
      "ANP Phoenix is a regulated fintech whose GenAI system, Sentinel, screens transactions for fraud and money laundering and drafts client reports. It has started producing anomaly flags that do not match its own stated reasoning. The pattern is small, has caused no customer complaint, no financial loss and no regulatory breach, and crosses no internal escalation threshold.",
      "Six executives hold different pieces of that picture, and different incentives for what to do with it. Over four timed rounds they decide what deserves attention, what gets written down, and who has the authority to say an AI's output cannot yet be trusted — before failure becomes visible.",
      "The anomaly never worsens. Across all four rounds no new evidence of harm arrives. What changes is who is asking: first engineering, then the organisation, then a regulator and an investor, and finally an anonymous whistle channel. What the simulation measures is what the team does as the audience changes but the facts do not.",
    ],

    story: [
      "Quarter close is four weeks away. Senior leadership is aligned around the growth story, and the company's reputation rests on being fast and safe with AI at the same time.",
      "Two enterprise clients are days from signing, both citing Sentinel by name. A routine AI-governance review is six weeks out. The CFO's bonus is tied to how quickly Sentinel rolls out, not to how accurate it is. Engineering thinks the behaviour is normal edge-case drift. Operations has seen similar flags resolve on their own before. Nobody in the company shares a definition of when an 'AI inaccuracy' becomes a 'hallucination'.",
      "Acting now slows Sentinel down and invites scrutiny of the whole programme. Waiting risks letting a small problem inside a live AI system grow unnoticed. Legal's view is that escalating without a clearer trigger creates a paper trail that cannot be undone.",
    ],

    components: [
      ["Six asymmetric roles", "CEO, CFO, CHRO, Head of Engineering, Head of Operations and Head of Product. Each sees a different feed, shaped by that function's own incentives and blind spots."],
      ["63 timed artifacts", "Memos, Slack threads, dashboards, analyst notes, regulator requests and client questions arrive on a live clock, whether the team is ready or not."],
      ["54 scored decisions", "Every role decides, every round. Not just the CEO — the team's outcome is the sum of what all six did."],
      ["Silence as a recorded position", "A decision left unanswered is recorded as No Response and scored as the worst outcome that decision offered. Not answering is still a position; it just has no owner."],
      ["Four framing decisions", "Each round closes with the CEO committing the organisation to one description of the problem — on behalf of the team, on the clock."],
      ["A live facilitator console", "Pause, resume, delay an artifact, inject a breaking-news interrupt, restart a round or end a session, for one team or the whole class."],
    ],

    objectives: [
      "Recognise a weak signal that carries real information while sitting below every threshold that would force a response.",
      "See how incentive structures shape which facts a function finds credible — without anyone acting in bad faith.",
      "Practise naming an owner for an ambiguous risk, and notice what happens across four rounds when nobody does.",
      "Distinguish changing a position because the evidence changed from changing it because someone outside started watching.",
      "Experience how an early framing compounds: the description a team commits to in round one quietly removes options by round four.",
      "Connect the exercise to how AI governance is actually assessed in practice, including the NIST AI Risk Management Framework and Gartner's AI TRiSM model.",
    ],

    included: [
      ["Facilitation guide", "Pre-session setup, a round-by-round run sheet with what to listen for, the full debrief script with discussion prompts, the scoring model, a framework map and troubleshooting."],
      ["Live facilitator console", "Real-time view of every team, with pause/resume, artifact delay and bypass, news interrupts, round restart and session termination."],
      ["Final results screen", "Released to students only when the simulation ends: four variables with their bands, the round-by-round trajectory, the cohort distribution and the team's framing pattern."],
      ["Per-team reports", "A downloadable report per team for the facilitator, and the same report for the students themselves."],
      ["Cohort debrief view", "Faculty-only rankings and distribution across teams, for projecting during the debrief."],
      ["Express 20-minute build", "The same scenario compressed for a guest lecture, demo or short workshop slot."],
    ],

    multiplayer:
      "Team-based and synchronous. One team is exactly six participants, one per role — the asymmetry between those six is the mechanism, so the roles are not optional. Any number of teams run in parallel on independent clocks, and the facilitator controls them individually or all at once from a single console.",

    durations: [
      ["Standard", "60 minutes of play across four timed rounds, plus 30 minutes of debrief."],
      ["Express", "20 minutes of play, same content and scoring, for a demo or a short slot."],
      ["Setup", "About 10 minutes for teams to form and claim roles."],
    ],
  },

  {
    slug: "meridian-retail-qbr",
    title: "Can the Board Trust This? The Meridian Retail Case",
    shortTitle: "Meridian Retail QBR",
    status: "LIVE",
    icon: "📊",
    tags: ["Data Analytics", "Business Intelligence", "Decision-Making"],

    facts: [
      ["90 min", "of play"],
      ["5", "roles per team"],
      ["5", "rounds"],
    ],

    video: null,

    tagline:
      "A revenue number Finance and Strategy cannot reconcile, days before the Board meets. Five analysts have to turn a raw, unchecked feed into something a Board can rely on.",

    overview: [
      "Meridian is a fast-growing retailer heading into a quarterly business review. Finance and Strategy are reporting different revenue figures from the same underlying data, and nobody can yet say which is right or why they differ.",
      "Five analytics roles work the problem across five rounds — from the raw feed through diagnosis, reconciliation and visualisation to the story that actually goes in front of the Board.",
      "The defining mechanic is consequence that compounds. A data-quality issue missed in an early round does not disappear; it follows the team forward and shapes what they are able to claim later, exactly as it would in a real reporting cycle.",
    ],

    story: [
      "The Board meets in days. The deck is not finished, and the number at the centre of it is contested.",
      "The feed the team is handed is raw and unchecked — the kind of file that arrives in practice rather than the clean extract that arrives in a classroom. Decisions about what to trust, what to exclude and what to flag are made under time pressure, with a Board-level audience waiting at the end of it.",
      "Along the way the team faces a mid-simulation disclosure that forces them to revisit what they have already committed to, and a Board-level question they must answer with the analysis they actually have, not the one they wish they had.",
    ],

    components: [
      ["Five analytics roles", "Team Lead, Data Quality Analyst, Diagnostics, Automation and Visualisation — each owning a different part of the pipeline."],
      ["Five rounds, one compounding dataset", "Work carried forward round to round. An early miss is still there at the end."],
      ["A real, messy data feed", "Students submit worked files, not multiple-choice answers."],
      ["Partial-credit scoring", "Per-field grading rather than right/wrong, so a partially correct reconciliation is recognised as such."],
      ["Confidence calibration", "Teams state how confident they are alongside each submission, and are scored on whether that confidence was warranted."],
      ["A facilitator-triggered disclosure", "A mid-simulation interrupt the facilitator fires when the room is ready for it."],
    ],

    objectives: [
      "Diagnose why two defensible figures from the same source disagree, and trace the discrepancy to its origin.",
      "Judge what a raw data feed can and cannot support before presenting it to anyone.",
      "Calibrate confidence — state how sure you are, and be accountable for having been right about that.",
      "Experience how an unexamined early assumption constrains every downstream conclusion.",
      "Turn a reconciled analysis into a claim a Board can act on, under time pressure and hostile questioning.",
    ],

    included: [
      ["Live facilitator console", "Per-team and whole-class pause/resume, round control, the Breaking News disclosure and session termination."],
      ["Cohort debrief and leaderboard", "Per-construct rankings and class distribution across teams."],
      ["Per-team reports", "Downloadable construct profile and round-by-round outcomes per team."],
      ["Reference wiki and FAQ", "A student-facing reference the facilitator curates and carries between cohorts."],
      ["Facilitator override", "Review a team's work and adjust a finalised construct where judgement warrants it."],
    ],

    multiplayer:
      "Team-based and synchronous. One team is five participants, one per analytics role. Teams run in parallel on their own clocks, with the facilitator controlling them individually or together.",

    durations: [
      ["Standard", "90 minutes across five rounds."],
      ["Debrief", "30 minutes, using the cohort leaderboard and per-team reports."],
      ["Setup", "About 10 minutes for teams to form and claim roles."],
    ],
  },
];

export const getSimulation = (slug) => SIMULATIONS.find((s) => s.slug === slug);
