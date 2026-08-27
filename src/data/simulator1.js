export const simulator1 = {
  id: "sim-1",
  title: "When Can You Trust What Your AI Just Told You?",

  companyBrief: `
ANP Phoenix, a fast-growing, publicly listed digital payments and analytics firm operating across North America, Europe and Asia-Pacific.

Over the last two years, ANP Phoenix has repositioned itself around Generative AI, embedding a proprietary GenAI capability — internally called Phoenix Sentinel — into fraud detection, anti-money-laundering screening, and client-facing reporting. The company markets Sentinel publicly as proof that a regulated fintech can deploy GenAI safely and at scale.

Externally, ANP Phoenix is frequently cited by regulators and enterprise clients as a benchmark for disciplined AI adoption. Internally, it is known for high performance expectations, rapid rollout cycles, and a strong cultural preference for shipping AI capability over slowing down to govern it. Engineering leadership is increasingly expected to co-own Sentinel's business outcomes, not just its uptime.

This combination has powered growth, but it has also narrowed how AI-related uncertainty is discussed.
  `,

  problemStatement: `
ANP Phoenix is not facing a crisis.

However, early signals suggest that Sentinel's outputs may soon require the organization to decide what deserves attention before failure becomes visible, and who has the authority to say an AI system's output can't yet be fully trusted.

The question confronting leadership is not technical. It is interpretive: how much value can be captured from a GenAI capability before responsible AI controls catch up with it — and who decides when that line has been crossed.
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
    CFO: "Missing guidance would materially affect market confidence in the AI growth story you've been telling investors.",
    CHRO: "Repeated non-escalation teaches people what “responsible AI” really means in practice, not on a slide.",
    "Head of Engineering": "Technically, this is not yet a confirmed model defect — but narratives about Sentinel's reliability harden quickly.",
    "Head of Operations": "Pausing Sentinel-dependent workflows mid-rollout creates operational debt.",
    "Head of Product": "The GenAI growth story depends on uninterrupted adoption signals."
  }
};
