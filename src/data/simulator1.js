export const simulator1 = {
  id: "sim-1",
  title: "When Can You Trust What Your AI Just Told You?",

  companyBrief: `
ANP Phoenix is a fast-growing, publicly listed digital payments and analytics firm operating across North America, Europe and Asia-Pacific.

Over the last two years, ANP Phoenix has repositioned itself around Generative AI, embedding a proprietary GenAI capability — internally called Phoenix Sentinel — into fraud detection, anti-money-laundering screening, and client-facing reporting. The company markets Sentinel publicly as proof that a regulated fintech can deploy GenAI safely and at scale.

Externally, ANP Phoenix is frequently cited by regulators and enterprise clients as a benchmark for disciplined AI adoption. Internally, it is known for high performance expectations, rapid rollout cycles, and a strong cultural preference for shipping AI capability over slowing down to govern it. Engineering leadership is increasingly expected to co-own Sentinel's business outcomes, not just its uptime.

This combination has powered growth, but it has also narrowed how AI-related uncertainty is discussed.
  `,

  problemStatement: `
ANP Phoenix is not facing a crisis.

However, early signals suggest that Sentinel's outputs may soon require the organization to decide what deserves attention before failure becomes visible, and who has the authority to say an AI system's output can't yet be fully trusted.

The question confronting leadership is not technical. It is interpretive: how much value can be captured from a GenAI capability before responsible AI controls catch up with it — and who decides when that line has been crossed.

What makes this harder than it sounds: leadership bonuses are tied to how fast Sentinel rolls out. Two large clients are about to sign, citing Sentinel by name. A regulatory review of the company's AI governance is six weeks out.

For scale, one industry estimate puts the average cost of poor AI data and model quality at $12.9 million a year for a large company, and a recent CEO survey found most CEOs worry about the quality of the data behind their own decisions. Legal's standing view is that escalating without a clearer trigger creates a paper trail that cannot be undone.
  `,

  roles: [
    "CEO",
    "CFO",
    "CHRO",
    "Head of Engineering",
    "Head of Operations",
    "Head of Product"
  ],

  roleDescriptions: {
    CEO: "Your credibility is still forming, and this Board increasingly asks about AI, not just revenue.",
    CFO: "If you stay quiet now and this becomes a problem later, it will look like you saw it coming and said nothing to investors.",
    CHRO: "Every time a concern about Sentinel goes unescalated, people learn that “responsible AI” is something the company says, not something it does.",
    "Head of Engineering": "Technically, this is not yet a confirmed model defect — but narratives about Sentinel's reliability harden quickly.",
    "Head of Operations": "Pausing Sentinel-dependent workflows mid-rollout creates operational debt.",
    "Head of Product": "The GenAI growth story depends on uninterrupted adoption signals."
  }
};
