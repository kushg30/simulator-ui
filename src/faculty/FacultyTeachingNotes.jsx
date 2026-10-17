import { useRef, useState } from "react";
import Collapsible from "./Collapsible";
import "./facultyGuide.css";

/**
 * Teaching Notes — the facilitator's intellectual preparation for ANP Phoenix.
 *
 * <p>Separate from the Quick Start Guide because the two are used differently. The guide is
 * operational and read front to back before a session; these notes are organised by field and
 * consulted by topic, and the document says plainly that you are not expected to cover everything.
 * Collapsible sections rather than one long page, for the same reason.
 *
 * <p>Confidential, like the guide. These notes name what the simulation is doing and why, which is
 * exactly what must not reach a participant beforehand.
 */

const SECTIONS = [
  {
    id: 1,
    title: "Ethics in Practice",
    sub: "the main ethical traditions applied to AI",
    key: "Decisions about AI are ethical as well as technical. The main traditions answer differently, and failures often start when the ethical side is not noticed or responsibility is spread too thin.",
    blocks: [
      {
        h: "1.1 Normative lenses applied to decisions about AI",
        items: [
          ["Consequence-based reasoning", "Judges a choice by its overall results for everyone affected. Strong on scale and on people who are easy to forget; weak because consequences are hard to predict, measurable and near-term effects count for more, and it can accept sacrificing a few for the many. Appears as cost-benefit analysis and expected-harm estimates."],
          ["Duty-based and rights-based reasoning", "Some things are owed to people whatever the results: honesty, respect for people as ends and not merely means, informed consent. Asks what is owed to people affected by an automated decision — to be told about it, given reasons, and able to contest it."],
          ["Virtue ethics (Aristotle; MacIntyre, 1981)", "Asks what kind of person or institution one is becoming, and what practical wisdom, honesty, courage and justice would require here. Vallor (2016) applies this to technology."],
          ["Justice-based reasoning (Rawls, 1971)", "Asks whether the rules and the distribution of benefits and burdens are fair. The veil of ignorance is a useful test: would you accept this distribution of risk if you did not know whether you would be the person affected?"],
          ["Contractualism (Scanlon, 1998)", "An act is wrong if it relies on principles the people affected could reasonably reject. Turns the question into one of justifiability to those affected."],
          ["The ethics of care (Noddings, 1984; Tronto, 1993)", "Starts from relationships of dependence and vulnerability — attentiveness, responsibility, competence and responsiveness. Draws attention to clients, employees and others who depend on decisions they cannot see."],
        ],
        note: "Leaders rarely apply one theory cleanly; they move between lenses without noticing. Much moral disagreement comes from different lenses, not different facts — so a useful habit is to ask which lens a group has quietly adopted, and what the others would say.",
      },
      {
        h: "1.2 The ethics of risk and uncertainty",
        prose: [
          "Hansson (2013): the ethics of risk is not only about how large a risk is. It is also about who is exposed to it, whether they consented, and who gains. Imposing a risk on people who cannot see it and have not agreed to it raises a different moral question from accepting a risk oneself.",
          "Jonas (1984): when potential harms are grave and knowledge is uncertain, the bad prognosis should be given priority. Critics say precaution can paralyse action and ignore the costs of not acting. A balanced view asks whether the precaution is proportionate, and whether the costs of acting and of not acting have both been counted.",
          "Moral luck (Williams, 1981; Nagel, 1979): we judge people partly by outcomes that were not fully in their control. Two people can make the same decision and be judged differently because of what followed — which is why hindsight judgments feel both unfair and unavoidable.",
          "Zimmerman (1997) on ignorance and blame: ignorance can excuse, but not when a person is responsible for failing to find out what they ought to have known. The law's related idea is wilful blindness — deliberately avoiding knowledge treated as equivalent to having it.",
        ],
      },
      {
        h: "1.3 Honesty, disclosure and the duties of leaders",
        prose: [
          "Honesty is more than not lying. Bok (1978) distinguishes lying from the wider category of deception. Williams (2002) separates two virtues of truth: accuracy, meaning care in getting one's beliefs right, and sincerity, meaning saying what one believes. Both can fail without any outright lie.",
          "What leaders owe depends on role, reliance and vulnerability. Fiduciary duties, duties of care and informed consent all rest on the idea that people who rely on someone's judgment are entitled to what they need to make their own choices. Law sets a minimum; ethics asks what the people relying on you would need to know, and when.",
        ],
      },
      {
        h: "1.4 Moral responsibility",
        items: [
          ["The problem of many hands", "Harm is often the product of many contributions, none decisive, so no individual seems fully responsible. Van de Poel, Royakkers and Zwart (2015) discuss how responsibility can still be assigned."],
          ["Responsibility and AI", "Matthias (2004): learning systems create a responsibility gap, because their behaviour cannot be fully predicted by those who build or operate them. Santoni de Sio and Mecacci (2021) distinguish four gaps — culpability, moral accountability, public accountability, active responsibility. Elish (2019) describes the opposite problem, the moral crumple zone, where blame falls on a human operator who had little real control."],
        ],
      },
      {
        h: "1.5 Self-justification and ethical blind spots",
        prose: [
          "Rest (1986): ethical action depends on several distinct steps, from noticing that a situation has an ethical side through to acting on one's judgment. A failure at the earliest step is easy to miss, because a person who never saw the issue does not experience a choice at all.",
          "Haidt (2001): moral judgments usually arrive first as quick intuitions, with reasoning following to justify them.",
          "Bazerman and Tenbrunsel (2011): people overestimate how ethical they are, partly because a “want” self competes with a “should” self. The ethical side of a decision can fade from view when it is framed as a business, technical or legal matter. Gino and Bazerman (2009) found people are more likely to accept others' unethical behaviour when it erodes gradually than when it changes abruptly.",
        ],
      },
      {
        h: "1.6 Ethical leadership, courage and voice",
        prose: [
          "Gentile (2010) on moral courage in practice: assumes a person already knows what is right, and asks how to act on it effectively — preparing arguments, allies and scripts in advance.",
          "Badaracco (1997): the hardest leadership choices are between two things that are both right. Kidder (1995) offers four patterns — truth against loyalty, individual against community, short term against long term, justice against mercy.",
          "Hirschman (1970): members respond to decline by leaving (exit), speaking up (voice) or staying loyal. Voice is costly and needs a response to be worthwhile, and loyalty can either sustain voice or suppress it.",
        ],
      },
      {
        h: "1.7 Corporate purpose and stakeholders",
        prose: [
          "Friedman (1970) argued the social responsibility of business is to increase its profits within the rules of the game. Freeman (1984) argued managers should take account of all groups that can affect or are affected by the firm.",
          "The live questions are whose claims count as legitimate, how conflicts are resolved, and what duties the firm has to people who cannot bargain with it. AI sharpens these questions because systems can affect many people who have no relationship with the firm other than being assessed by it.",
        ],
      },
      {
        h: "1.8 The ethics of AI: principles and their limits",
        prose: [
          "Explicability is an ethical requirement as well as a technical one: people affected need to understand decisions well enough to contest them.",
          "Floridi (2019) names five ways digital ethics goes wrong in practice: ethics shopping (choosing the framework that suits), bluewashing (misleading claims), lobbying (using ethics to avoid regulation), dumping (exporting risky practices to weaker jurisdictions) and shirking (doing less where it is less rewarded). Wagner (2018) argues ethics can be used as an escape from regulation.",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Judgment and decision-making",
    sub: "how people decide under uncertainty, and why capable people err",
    key: "Decisions are made on incomplete evidence every day. The ethical question is how the costs of acting and of not acting are weighed.",
    blocks: [
      {
        h: "2.1 Deciding under uncertainty",
        prose: [
          "Every decision on uncertain evidence can fail two ways: acting when there was no need, or failing to act when there was. The costs are usually unequal and fall on different people.",
          "Think of a smoke alarm. Very sensitive, and it gives many false alarms until people stop listening. Less sensitive, and it will sometimes miss a real fire. Where to set the threshold is partly technical and partly ethical, because it decides who bears the risk.",
          "Tversky and Kahneman (1974) describe representativeness, availability and anchoring, and the systematic errors they produce.",
        ],
      },
      {
        h: "2.2 Decision quality and outcome quality",
        prose: [
          "A good decision can have a bad outcome, and a bad decision a good one. Once people know an outcome they overestimate how predictable it was, which makes earlier choices look careless or lucky. A fair review judges a decision by the information and options available at the time.",
        ],
      },
      {
        h: "2.3 Commitment and group pressure",
        prose: [
          "Staw (1976): people personally responsible for an earlier poor decision committed more resources afterwards, apparently to justify the original choice. Replications are mixed, but the pattern still explains why organisations persist with failing courses of action.",
          "Janis (1972) on groupthink: cohesive groups under pressure rationalise warnings away, pressure dissenters and censor themselves, creating false unanimity. The full model has mixed support; the individual symptoms remain useful to look for.",
        ],
      },
      {
        h: "2.4 Predictable surprises",
        prose: [
          "Bazerman and Watkins (2004) identify three barrier groups — psychological (positive illusions, short-term focus), organisational (silos, fragmented information) and political (small well-organised groups benefiting while costs spread thinly) — and three response tasks: recognise the threat, prioritise it, mobilise action.",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Organisations, incentives and culture",
    sub: "how settings shape conduct, voice and silence",
    key: "Culture and incentives, more than individual character, shape what people notice, say and do.",
    blocks: [
      {
        h: "3.1 Culture and incentives",
        prose: [
          "Schein (2010) describes culture at three levels: visible structures and symbols, espoused values, and the basic assumptions that actually guide behaviour. A useful question is where the levels do not match.",
          "Bazerman and Tenbrunsel (2011) show how incentives and conflicts of interest blind well-meaning people to problems in plain view.",
        ],
      },
      {
        h: "3.2 Normalisation of deviance",
        prose: [
          "Vaughan (1996) studied the Challenger launch decision and found no one broke rules in an obvious way. Evidence of damage on earlier flights was repeatedly reinterpreted as acceptable within the organisation's production culture, because no disaster had followed.",
        ],
      },
      {
        h: "3.3 Voice and silence",
        prose: [
          "Edmondson (1999) found team psychological safety — a shared belief that it is safe to take interpersonal risks — associated with learning behaviour. Edmondson (2019) stresses it is not about being nice or lowering standards; it sits alongside high standards and is about candour. Voice needs two things: willingness to speak and willingness to hear.",
        ],
      },
      {
        h: "3.4 Learning from failure and high reliability",
        prose: [
          "Cannon and Edmondson (2005): organisations rarely learn from failure because of psychological and social barriers; they suggest identifying failure, analysing it, and experimenting deliberately.",
          "Weick and Sutcliffe (2015) describe five habits of high-reliability organisations: preoccupation with failure, reluctance to simplify, sensitivity to operations, commitment to resilience, deference to expertise. Reason (1990) describes accidents arising when latent weaknesses line up, like holes in layers of Swiss cheese.",
        ],
      },
      {
        h: "3.5 Responsibility: diffusion and displacement",
        prose: [
          "McCoy's Parable of the Sadhu (1983): climbers each did something for a dying man while no one took responsibility for what happened to him. Elish (2019) shows the other side — in an automated system responsibility may be displaced onto the nearest human operator while the system and its designers escape scrutiny.",
        ],
      },
    ],
  },
  {
    id: 4,
    title: "People and AI systems",
    sub: "trust, interpretability, generative AI, fairness and oversight",
    key: "Trust in AI should match the evidence for it. Explanations, fairness and human oversight need to be tested, not assumed.",
    blocks: [
      {
        h: "4.1 Automation bias and calibrated trust",
        prose: [
          "Skitka, Mosier and Burdick (1999) found people using a computer aid made errors of omission (missing events the aid did not flag) and of commission (following the aid even when it contradicted other reliable indicators).",
          "Lee and See (2004) argue automation is often problematic because people fail to rely on it appropriately, and that trust guides reliance when complexity makes full understanding impractical. The aim is trust that matches the real capability of the system and is revised as evidence changes.",
        ],
      },
      {
        h: "4.2 Interpretability and explanation",
        prose: [
          "Rudin (2019): for high-stakes decisions, models interpretable by design should be preferred over explanations added to opaque models, because added explanations can be unreliable or misleading.",
          "Lipton (2018): interpretability is not a single property — transparency of the model itself differs from post-hoc explanation. The shared lesson is that an explanation is itself a claim that needs evidence.",
        ],
      },
      {
        h: "4.3 Generative AI",
        prose: [
          "Ji and colleagues (2023) survey hallucination in language generation: output that reads fluently but is nonsensical or not faithful to the source or the facts. NIST's generative AI profile (2024) lists risks new or worsened by generative systems, including confabulation, information integrity, data privacy and harmful bias.",
        ],
      },
      {
        h: "4.4 Bias, fairness and privacy",
        prose: [
          "Barocas, Hardt and Narayanan (2023) explain how data-driven systems can produce discriminatory results without anyone intending it, and why different definitions of fairness can conflict — so choosing between them is a normative decision, not only a technical one.",
        ],
      },
      {
        h: "4.5 Human oversight and meaningful human control",
        prose: [
          "Green (2022) surveyed 41 policies requiring human oversight of government algorithms, and argues they assume people can effectively oversee algorithms — which research does not support — and that requiring oversight can lend legitimacy to flawed systems.",
          "Santoni de Sio and van den Hoven (2018) develop meaningful human control: humans, not computers, should remain in control of and morally responsible for the relevant decisions. Oversight has to be designed, resourced and given real authority — it cannot be assumed to work because a person is in the loop.",
        ],
      },
    ],
  },
  {
    id: 5,
    title: "AI governance, accountability and disclosure",
    sub: "frameworks, finance-sector practice, regulation",
    key: "Frameworks and regulation set a vocabulary and a minimum. Ethics asks what the minimum leaves out.",
    blocks: [
      {
        h: "5.1 Frameworks and standards",
        prose: [
          "The OECD Principles (2019, amended 2024) are an influential statement of high-level values. The European Commission's High-Level Expert Group (2019) set out seven requirements for trustworthy AI. UNESCO's Recommendation on the Ethics of AI (2021) was adopted by its member states.",
          "The NIST AI Risk Management Framework (2023) is voluntary, organising risk management into govern, map, measure and manage. ISO/IEC 42001 (2023) sets requirements for an AI management system. In India, NITI Aayog published approach documents on responsible AI (February and August 2021).",
        ],
      },
      {
        h: "5.2 Governance on paper and in practice",
        prose: [
          "Power (1997) warns that audit can become a ritual of verification, in which organisations are checked for having control systems rather than for whether their controls work. The same risk applies to AI governance: a published policy is not the same as practice. Frameworks help most as a shared vocabulary for asking questions, not as checklists.",
        ],
      },
      {
        h: "5.3 Model risk management in finance",
        prose: [
          "US supervisory guidance SR 11-7 (2011) treats model risk as arising from errors in models and from misuse of them, with three areas of control: development and use, validation, and governance. A central idea is effective challenge — critical analysis by informed people who are objective and have the standing to require changes.",
        ],
      },
      {
        h: "5.4 Trust and stakeholders",
        prose: [
          "Mayer, Davis and Schoorman (1995) define trust as willingness to be vulnerable based on expectations of ability, benevolence and integrity. Trust is slow to build and quick to lose, and a judgment about any one dimension can change the whole relationship.",
        ],
      },
      {
        h: "5.5 Law and regulation",
        warn: "Regulation here is moving quickly — check dates and status before quoting any of this.",
        items: [
          ["EU Artificial Intelligence Act (Regulation 2024/1689)", "Risk-based. Some practices prohibited; high-risk systems face requirements including risk management, data governance, documentation, logging, human oversight, accuracy and robustness. Systems evaluating creditworthiness of individuals are high-risk. Applies in phases."],
          ["GDPR (Regulation 2016/679)", "Article 22 restricts decisions based solely on automated processing that have legal or similarly significant effects."],
          ["India: Digital Personal Data Protection Act, 2023", "The 2025 Rules were notified in November 2025 and bring the Act into force in phases over 18 months, with most operational duties applying from May 2027."],
          ["RBI: FREE-AI", "The committee report of 13 August 2025 sets out seven Sutras and six strategic pillars with 26 recommendations, including board-approved AI policies, audit mechanisms and incident reporting. Recommendations at the time of writing — check for later RBI directions."],
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Cases",
    sub: "real examples to draw on in the debrief",
    blocks: [
      {
        items: [
          ["Space Shuttle Challenger (1986)", "Broke apart 73 seconds after launch in cold weather. Engineers had raised concerns about the seals the night before; the recommendation was reversed after management discussion. Vaughan (1996) explains how earlier signs of seal damage had come to be treated as acceptable."],
          ["UK Post Office Horizon", "Hundreds of sub-postmasters prosecuted or held liable for shortfalls recorded by the Horizon system. Bates v Post Office (2019) found Horizon contained bugs, errors and defects. Often used to study the presumption that a computer system is reliable."],
          ["Robodebt, Australia", "From 2015 an automated scheme raised welfare debts by averaging annual income across fortnights. Found unlawful. The Royal Commission (2023) examined how warnings did not lead to change and how responsibility was spread across agencies."],
          ["Dutch childcare benefits scandal", "A risk classification system with nationality-related indicators flagged families for suspected fraud. Thousands wrongly accused and made to repay large sums. Parliamentary inquiry reported December 2020; the government resigned in January 2021."],
          ["Boeing 737 MAX", "Two crashes killed 346 people. A US House committee examined production pressure, a flight control system poorly understood by pilots, and delegation of certification work to the manufacturer."],
          ["Mata v. Avianca (2023)", "Lawyers filed a brief citing cases invented by a generative AI tool; sanctions imposed June 2023. Short, and shows over-reliance on fluent output without checking."],
          ["COMPAS and ProPublica (2016)", "Journalists reported Black defendants were more likely to be wrongly labelled higher risk; the vendor replied the scores were equally accurate across groups. A standard example of conflict between definitions of fairness."],
          ["Wells Fargo sales practices", "Aggressive sales targets followed by large numbers of unauthorised customer accounts. Fined in 2016; independent directors' report in 2017. Used to study incentives and the response of senior leaders."],
        ],
      },
    ],
  },
  {
    id: 7,
    title: "Facilitating the discussion",
    sub: "structure, principles and common misconceptions",
    blocks: [
      {
        h: "7.1 How debriefs are usually structured",
        prose: [
          "Kolb (1984) describes learning as a cycle of concrete experience, reflection, abstract thinking and active experimentation. A common debrief sequence follows that logic: from reactions, to a shared account of what happened, to analysis of why, to application in participants' own settings. Skipping reactions leaves strong feelings unspoken; skipping application leaves the experience unconnected to practice.",
        ],
      },
      {
        h: "7.2 Principles for the room",
        bullets: [
          "Treat the debrief itself as a place that needs psychological safety. Participants will say less if they feel judged.",
          "Avoid telling participants whether they were right. Ask what reasoning they would defend, and to whom.",
          "Separate the person from the role. A participant who played a role made choices inside that role.",
          "Remember hindsight. Participants decided without knowing how things would turn out.",
          "Invite disagreement. If everyone agrees quickly, ask what a thoughtful critic would say.",
          "Choose a few ideas from these notes that fit what you observed, and introduce each in a sentence or two before asking a question. A lecture on every concept will close the discussion down.",
          "Let the close leave a question, not a neat lesson.",
        ],
      },
      {
        h: "7.3 Misconceptions that often come up",
        bullets: [
          "That AI output is either always reliable or always useless. The useful position is calibrated trust.",
          "That governance means paperwork, or that a published policy is the same as practice.",
          "That incentives do not affect people who are careful and honest.",
          "That a bad outcome shows a bad decision, and a good outcome shows a good one.",
          "That ethical problems are always visible as ethical problems at the time.",
        ],
      },
    ],
  },
];

const READING = [
  ["Ethics, moral responsibility and moral psychology",
    "Primary texts: Aristotle, Nicomachean Ethics; Kant, Groundwork (1785); Mill, Utilitarianism (1863). Badaracco, Defining Moments (1997). Bazerman & Tenbrunsel, Blind Spots (2011). Bok, Lying (1978). Coeckelbergh, AI Ethics (2020). Floridi (2019). Freeman (1984). Friedman (1970). Gentile, Giving Voice to Values (2010). Gino & Bazerman (2009). Haidt (2001). Hansson, The Ethics of Risk (2013). Hirschman, Exit, Voice, and Loyalty (1970). Jonas (1984). Kidder (1995). MacIntyre, After Virtue (1981). Matthias (2004). Nagel, Mortal Questions (1979). Noddings, Caring (1984). Rawls (1971). Rest (1986). Santoni de Sio & Mecacci (2021). Scanlon (1998). Tronto (1993). Vallor (2016). van de Poel, Royakkers & Zwart (2015). Wagner (2018). Williams, Moral Luck (1981) and Truth and Truthfulness (2002). Zimmerman (1997)."],
  ["Judgment, organisations and culture",
    "Bazerman & Watkins, Predictable Surprises (2004). Cannon & Edmondson (2005). Edmondson (1999) and The Fearless Organization (2019). Janis, Victims of Groupthink (1972). Kahneman, Thinking, Fast and Slow (2011). Kolb (1984). Mayer, Davis & Schoorman (1995). McCoy (1983). Reason, Human Error (1990). Schein (2010). Staw (1976). Tversky & Kahneman (1974). Vaughan, The Challenger Launch Decision (1996). Weick & Sutcliffe (2015)."],
  ["Technology, AI ethics and governance",
    "Barocas, Hardt & Narayanan (2023). Federal Reserve/OCC, SR 11-7 (2011). Elish (2019). EC High-Level Expert Group (2019). Green (2022). ISO/IEC 42001:2023. Ji et al. (2023). Lee & See (2004). Lipton (2018). NIST AI RMF 1.0 (2023) and Generative AI Profile (2024). NITI Aayog (2021). OECD (2019, amended 2024). Parasuraman & Manzey (2010). Power (1997). Rudin (2019). Santoni de Sio & van den Hoven (2018). Skitka, Mosier & Burdick (1999). UNESCO (2021)."],
  ["Law and regulation",
    "Digital Personal Data Protection Act, 2023 (India). Regulation (EU) 2016/679 (GDPR). Regulation (EU) 2024/1689 (EU AI Act). RBI FREE-AI report (2025). These change — read the current versions."],
  ["Cases",
    "Angwin et al. (2016). Bates & Others v Post Office Ltd [2019] EWHC 3408 (QB). Dutch Parliamentary Inquiry (2020). Wells Fargo independent directors' report (2017). Mata v. Avianca (2023). Presidential Commission on the Challenger Accident (1986). Royal Commission into Robodebt (2023). UK Post Office Horizon IT Inquiry. US House Committee, Boeing 737 MAX (2020)."],
];

export default function FacultyTeachingNotes() {
  const sheetRef = useRef(null);
  const [expandAll, setExpandAll] = useState(false);

  /**
   * Print the whole notes.
   *
   * Collapsible does not render its children while closed, so printing with sections collapsed
   * would produce a document containing only the headings. Everything is forced open first, and
   * the print is deferred by a frame so the newly-mounted sections are in the DOM before the
   * markup is copied.
   */
  const printAll = () => {
    setExpandAll(true);
    setTimeout(print, 60);
  };

  const print = () => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const MINE = /fguide/;
    const collect = (rules) =>
      Array.from(rules)
        .map((r) => {
          if (r.type === CSSRule.MEDIA_RULE) {
            const inner = collect(r.cssRules);
            return inner ? `@media ${r.conditionText}{${inner}}` : "";
          }
          if (r.type === CSSRule.PAGE_RULE) return r.cssText;
          return r.selectorText && MINE.test(r.selectorText) ? r.cssText : "";
        })
        .filter(Boolean)
        .join("\n");
    const styles = Array.from(document.styleSheets)
      .map((ss) => {
        try {
          const css = collect(ss.cssRules);
          return css ? `<style>${css}</style>` : "";
        } catch { return ""; }
      })
      .join("");
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;
    // details/summary collapse in print by default; force them open so the printed notes are whole.
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>ANP_Phoenix_Teaching_Notes</title>${styles}` +
        `<style>html,body{background:#fff!important;margin:0!important;padding:0!important}` +
        `.fguide{color:#111!important;background:#fff!important;max-width:none!important}` +
        `.fguide .fguide-noprint{display:none!important}` +
        `@page{margin:14mm}</style></head><body>${sheet.outerHTML}</body></html>`
    );
    win.document.close();
    const fire = () => { win.focus(); win.print(); };
    if (win.document.readyState === "complete") setTimeout(fire, 150);
    else win.addEventListener("load", () => setTimeout(fire, 150));
  };

  return (
    <div>
      <div className="f-row fguide-noprint" style={{ marginBottom: 14, alignItems: "center" }}>
        <button className="f-ghost" onClick={() => setExpandAll((v) => !v)}>
          {expandAll ? "Collapse all" : "Expand all"}
        </button>
        <button className="f-ghost" onClick={printAll} style={{ marginLeft: "auto" }}>
          Print / Save as PDF
        </button>
      </div>

      <div className="fguide" ref={sheetRef}>
        <div className="fguide-mast">
          <div className="fguide-eyebrow">Teaching Notes · for facilitators</div>
          <h1>When Can You Trust What Your AI Just Told You?</h1>
          <p className="fguide-lede">
            A working grounding in the ethics of decisions about AI in organisations: ethical theory,
            research on judgment and on organisations, the governance and regulatory landscape, real
            cases, and guidance for leading the discussion.
          </p>
          <p className="fguide-note" style={{ marginTop: 0 }}>
            <b>How to use them.</b> Consult by topic. The notes are organised by field, not by
            importance, and <b>you are not expected to cover everything</b> — pick two or three ideas
            that fit what you actually saw in the room.
          </p>
          <p className="fguide-warn">
            Confidential. Not to be shared with participants before the session.
          </p>
        </div>

        {SECTIONS.map((s) => (
          <section className="fguide-sec" key={s.id}>
            <Collapsible
              key={`${s.id}-${expandAll}`}
              title={`${s.id} · ${s.title}`}
              subtitle={s.sub}
              defaultOpen={expandAll || s.id === 1}
            >
              {s.key && <p className="fguide-key">{s.key}</p>}
              {s.blocks.map((b, bi) => (
                <div key={bi} className="fguide-block">
                  {b.h && <h4>{b.h}</h4>}
                  {b.warn && <p className="fguide-warn">{b.warn}</p>}
                  {(b.prose || []).map((p, i) => (
                    <p className="fguide-beat" key={i}>{p}</p>
                  ))}
                  {b.items && (
                    <dl className="fguide-dl fguide-dl-wide">
                      {b.items.map(([k, v]) => (
                        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                      ))}
                    </dl>
                  )}
                  {b.bullets && (
                    <ul className="fguide-ul">
                      {b.bullets.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  )}
                  {b.note && <p className="fguide-note">{b.note}</p>}
                </div>
              ))}
            </Collapsible>
          </section>
        ))}

        <section className="fguide-sec">
          <Collapsible key={`reading-${expandAll}`} title="Reading list" subtitle="around eighty sources, by field" defaultOpen={expandAll}>
            <dl className="fguide-dl fguide-dl-wide">
              {READING.map(([field, list]) => (
                <div key={field}><dt>{field}</dt><dd>{list}</dd></div>
              ))}
            </dl>
          </Collapsible>
        </section>
      </div>
    </div>
  );
}
