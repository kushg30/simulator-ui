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
    title: "When Can You Trust What Your AI Just Told You?",
    shortTitle: "ANP Phoenix",
    status: "LIVE",
    icon: "🤖",
    // Ethics first, deliberately. The published facilitator material is explicit that the ethical
    // questions are the heart of the session and the AI is the setting that makes them hard — so the
    // page a buyer reads should say that too, rather than selling it as an AI-governance exercise.
    tags: ["Ethics", "Responsible AI", "Leadership Judgment"],

    facts: [
      ["2 × 90 min", "sessions"],
      ["6", "roles per team"],
      ["4", "rounds, 60 min live"],
    ],

    video: "https://www.youtube.com/embed/k3IqrQ7j-Ms",

    tagline:
      "Six executives of a regulated fintech face two hard questions. What do they owe to the people who rely on them? Who has the authority to say that an AI's output cannot yet be trusted? They must decide before a failure becomes visible.",

    overview: [
      "A regulated fintech has staked its reputation on a generative AI system used in fraud detection and client reporting. Its outputs start drifting in ways no one can fully explain. Six executives, each with different information and incentives, must decide what deserves attention — and who has the authority to say that an AI output cannot yet be trusted. They must do this before failure becomes visible.",
      "The ethical questions are the heart of the session. What does the company owe to customers and regulators? Who is accountable? Are concerns spoken, or left unsaid? The AI is the setting that makes these questions hard.",
      "Nothing has visibly failed, and no rule has been broken. Each executive holds a different piece of the picture and faces different incentives — which is what makes the decision a judgment rather than a procedure.",
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
      "Recognise the ethical side of a decision that looks operational, when no rule has been broken and nothing has visibly failed.",
      "Weigh what the company owes to customers, regulators and employees against commercial pressure and personal incentives.",
      "Judge how far to trust an AI's output, and who has the authority and the duty to say that it cannot yet be trusted.",
      "See how accountability is shared or spread across a team, and how early decisions shape what is possible later.",
    ],

    /** The four stages a facilitator runs, in order. Shown on the page so a buyer can picture the day. */
    howItRuns: [
      ["Setup", "Open the session on the platform and share the link. Under fifteen minutes. Participants join and each takes a role."],
      ["Live simulation", "Four rounds in 60 minutes. The platform manages timing and the delivery of information. Early decisions shape what is possible later."],
      ["Report", "When the simulation ends, every participant and the facilitator can download a report at once."],
      ["Debrief", "Led in a second session, using the reports and the results across all teams."],
    ],

    included: [
      ["Quick Start Guide", "The facilitator's operating manual: forming teams, a sample class plan for both sessions, the opening briefing, room and technical requirements, and how to lead the debrief."],
      ["Teaching Notes", "Supporting notes and reading — the ethical traditions applied to AI, judgment under uncertainty, organisational culture and voice, AI governance and regulation, real cases, and a reading list of around eighty sources."],
      ["Walkthrough video", "Watch before the session, to see what participants will experience."],
      ["Live facilitator console", "Real-time view of every team, with pause/resume, artifact delay and bypass, news interrupts, round restart and session termination."],
      ["Results and reports", "Group and individual scores, a cohort ranking and a report for every participant, available as soon as the simulation ends."],
      ["Express 20-minute build", "The same scenario compressed for a guest lecture, demo or short workshop slot."],
    ],

    multiplayer:
      "Live, in class, in a browser — one device per participant, and teams discuss throughout. A team is six, one per role, and the asymmetry between those six is the mechanism rather than a detail. Class size is ten or more: a class of sixty runs as ten teams at the same time, each on its own clock, all controlled from one facilitator console.",

    durations: [
      ["Total", "Two sessions of 90 minutes. Session 1: setup, simulation and a short reflection. Session 2: the debrief. Same day with a break, or on different days."],
      ["Session 1", "15 minutes to set up and brief, 60 minutes of live simulation across four rounds, then reflection and reports."],
      ["Session 2", "90 minutes of debrief, using the reports and the results across all teams."],
      ["Express", "A 20-minute build of the same scenario, for a guest lecture or demo."],
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
