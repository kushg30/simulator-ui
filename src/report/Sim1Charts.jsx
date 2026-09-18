/**
 * Charts for the Simulator 1 report and debrief.
 *
 * Plain inline SVG — no charting library. These render inside a print-to-PDF sheet, where a canvas
 * would rasterise badly and a CDN dependency would be one more thing to fail in a classroom.
 *
 * Direction matters more than magnitude here: only Early Signal Legitimization is favourable when
 * high, so every chart takes an `adverse` predicate rather than colouring by value alone.
 */

const GOLD = "#b3902f";
const ADVERSE = "#a8452f";
const LINE = "#e7e3d8";
const FAINT = "#8b93a3";

/**
 * Five-axis radar of the Set-B construct profile — the shape of how a team handled ambiguity, in one
 * glance. Adverse constructs are plotted as-is (not inverted): a wide shape on the four adverse axes
 * IS the finding, and inverting them would quietly flatter a team that drifted.
 */
export function ConstructRadar({ values, labels, adverse, size = 260 }) {
  const keys = Object.keys(values);
  const n = keys.length;
  if (!n) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 46;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const at = (i, frac) => [cx + Math.cos(angle(i)) * r * frac, cy + Math.sin(angle(i)) * r * frac];

  const pts = keys.map((k, i) => at(i, Math.max(0, Math.min(100, values[k] ?? 50)) / 100));
  // A student payload carries bands without the 0-100 values behind them, so the caller plots band
  // midpoints. The shape still reads; the exact score stays where it belongs.
  const poly = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg width={size} height={size} role="img" aria-label="Construct profile">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={keys.map((_, i) => at(i, f).map((v) => v.toFixed(1)).join(",")).join(" ")}
          fill="none"
          stroke={LINE}
        />
      ))}
      {keys.map((_, i) => {
        const [x, y] = at(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={LINE} />;
      })}

      <polygon points={poly} fill="rgba(179,144,47,0.18)" stroke={GOLD} strokeWidth="1.8" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" fill={adverse.has(keys[i]) ? ADVERSE : GOLD}>
          <title>{`${labels[keys[i]]}: ${bandOfValue(values[keys[i]])}`}</title>
        </circle>
      ))}

      {keys.map((k, i) => {
        const [x, y] = at(i, 1.2);
        const anchor = Math.abs(x - cx) < 12 ? "middle" : x > cx ? "start" : "end";
        // Long construct names wrap onto a second line rather than running off the chart.
        const words = (labels[k] || k).split(" ");
        const lines = words.length > 1 ? [words.slice(0, -1).join(" "), words.slice(-1)[0]] : words;
        return (
          <text key={k} x={x} y={y} textAnchor={anchor} fontSize="9.5" fill={FAINT}>
            {lines.map((ln, j) => (
              <tspan key={j} x={x} dy={j === 0 ? 0 : 10}>{ln}</tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Horizontal bars with a direction-aware colour: gold where the value is favourable, red where it is
 * pressure building against the team. Used for the construct profile in the report body.
 */
export function ConstructBars({ values, labels, adverse, standing }) {
  return (
    <div>
      {Object.keys(values).map((k) => {
        const v = Math.max(0, Math.min(100, values[k] ?? 0));
        const bad = adverse.has(k) ? v >= 67 : v < 34;
        const st = standing?.[k];
        return (
          <div className="band-row" key={k}>
            <div className="band-name">
              {labels[k]}
              <span>{adverse.has(k) ? "Higher is more concerning" : "Higher is stronger"}</span>
            </div>
            <div className="segs">
              {[0, 1, 2].map((s) => (
                <div
                  key={s}
                  className={`seg${v >= (s + 1) * 33.4 - 0.4 ? " on" : ""}${bad ? " bad" : ""}`}
                />
              ))}
            </div>
            <div>
              <span className={`band-val${bad ? " bad" : ""}`}>
                {v >= 67 ? "High" : v >= 34 ? "Medium" : "Low"}
              </span>
              {st && st.outOf > 1 && (
                <span className="band-rank">
                  {ordinal(st.rank)} of {st.outOf} in the cohort · {st.percentile}th percentile
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Cohort ranking: one card per construct, teams as ranked bars. Best-first, where "best" respects
 * direction — for the four adverse constructs the LOWEST score leads the board.
 */
export function RankBars({ leaderboard, labels, adverse, order, highlightRunId }) {
  const byConstruct = leaderboard?.constructs || {};
  return (
    <div className="f-rank-grid">
      {order.map((c) => {
        const rows = byConstruct[c] || [];
        const isAdverse = adverse.has(c);
        return (
          <div className="f-rank-card" key={c}>
            <div className="f-rank-title">
              {labels[c]}
              <span className="f-rank-dir">{isAdverse ? "lower is better" : "higher is better"}</span>
            </div>
            {rows.length === 0 && <div className="f-note">No teams yet.</div>}
            {rows.map((r) => (
              <div
                className={`f-rank-row${r.runId === highlightRunId ? " f-rank-me" : ""}`}
                key={r.runId || r.teamName}
                title={`${r.teamName}: ${r.value} (${r.band})`}
              >
                <span className="f-rank-name">{r.teamName}</span>
                <span className="f-rank-track">
                  <span
                    className="f-rank-fill"
                    style={{
                      width: `${Math.max(2, r.value)}%`,
                      background: isAdverse ? "#a8452f" : "#3fb950",
                    }}
                  />
                </span>
                <span className="f-rank-val">{r.value}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Class distribution: for each construct, how the cohort split across Low / Medium / High. This is
 * the chart the facilitator actually projects — it shows whether a pattern is one team or the room.
 */
export function BandDistribution({ leaderboard, labels, adverse, order }) {
  const byConstruct = leaderboard?.constructs || {};
  const total = leaderboard?.teamCount || 0;
  if (!total) return null;

  return (
    <div className="f-dist">
      {order.map((c) => {
        const rows = byConstruct[c] || [];
        const counts = { Low: 0, Medium: 0, High: 0 };
        rows.forEach((r) => { counts[r.band] = (counts[r.band] || 0) + 1; });
        const isAdverse = adverse.has(c);
        // Colour by MEANING, not by band name: High is the bad end for the four adverse constructs
        // and the good end for Early Signal Legitimization.
        const colour = (band) => {
          if (band === "Medium") return "#c1762a";
          const good = isAdverse ? band === "Low" : band === "High";
          return good ? "#3d8a63" : "#a8452f";
        };
        return (
          <div className="f-dist-row" key={c}>
            <div className="f-dist-name">
              {labels[c]}
              <span>{isAdverse ? "high is adverse" : "high is good"}</span>
            </div>
            <div className="f-dist-bar">
              {["Low", "Medium", "High"].map((b) =>
                counts[b] ? (
                  <span
                    key={b}
                    className="f-dist-seg"
                    style={{ width: `${(100 * counts[b]) / total}%`, background: colour(b) }}
                    title={`${b}: ${counts[b]} of ${total} teams`}
                  >
                    {counts[b]}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        );
      })}
      <div className="f-note" style={{ marginTop: 8 }}>
        Each bar is the whole cohort ({total} team{total === 1 ? "" : "s"}), split Low · Medium · High.
        Green is the favourable end for that construct, red the adverse end.
      </div>
    </div>
  );
}

/** Banding used everywhere on the platform: >=67 High, >=34 Medium, else Low. */
export function bandOfValue(v) {
  if (v == null) return "—";
  return v >= 67 ? "High" : v >= 34 ? "Medium" : "Low";
}

/** Radius a band plots at when the exact value is withheld (student reports). */
export const BAND_PLOT = { High: 84, Medium: 50, Low: 18 };

export function ordinal(n) {
  if (n == null) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ── Final Results Screen charts (script section 8) ────────────────────────────
   These render on the dark app surface, unlike the report's charts which sit on
   printed paper, so they take their colours from the results palette rather than
   the report's. All inline SVG: no CDN to fail in a classroom, and they stay
   crisp if a facilitator projects the screen. */

const R_INK = "#e5e9f2";
const R_MUTED = "#8b93a8";
const R_GRID = "rgba(255,255,255,0.10)";
const VAR_COLOR = {
  trust: "#4a9eff",
  governance: "#c9a84c",
  rigor: "#3fb950",
  exposure: "#e5786a",
};

/**
 * These four charts render in two places now: the Final Results Screen, which is dark, and the team
 * report, which is cream paper and also gets printed. Near-white ink and translucent-white fills are
 * invisible on paper, so every surface-dependent colour comes from here instead of being inline.
 * The four variable hues are shared — they carry meaning across both surfaces — but the two golds
 * differ, because the screen's gold is too pale to hold on cream.
 */
const PALETTE = {
  dark: {
    ink: R_INK,
    muted: R_MUTED,
    grid: R_GRID,
    neutral: "rgba(255,255,255,0.14)",
    mine: "#c9a84c",
    mineEdge: "#e4c76a",
    fillMine: "rgba(201,168,76,0.16)",
    varColor: VAR_COLOR,
  },
  light: {
    ink: "#1c2230",
    muted: "#5b6577",
    grid: "#e7e3d8",
    neutral: "#dcd8cc",
    mine: "#b3902f",
    mineEdge: "#8d7023",
    fillMine: "rgba(179,144,47,0.16)",
    varColor: { ...VAR_COLOR, governance: "#a8862c", rigor: "#2f7d4a", exposure: "#c2543f" },
  },
};
const paletteFor = (theme) => PALETTE[theme] || PALETTE.dark;

/**
 * The cohort's composite scores as ranked bars, with this team's own bar marked.
 *
 * The point is the SHAPE of the distribution, not the rank number — whether a team sits in a tight
 * cluster or well clear of it says more than "4th of 11". Bars are unlabelled by design: another
 * team's score is not this team's to read.
 */
export function CohortBars({ cohort = [], width = 520, barH = 13, gap = 5, theme = "dark" }) {
  if (!cohort.length) return null;
  const P = paletteFor(theme);
  const vals = cohort.map((c) => c.composite);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(1, ...vals);
  const span = hi - lo || 1;
  const padL = 34;
  const h = cohort.length * (barH + gap) + 26;
  const zeroX = padL + ((0 - lo) / span) * (width - padL - 16);

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className="res-svg"
      role="img" aria-label="Composite score across the cohort">
      {/* A zero line, because a negative composite is a real and meaningful outcome here. */}
      <line x1={zeroX} y1={4} x2={zeroX} y2={h - 20} stroke={P.grid} />
      {cohort.map((c, i) => {
        const y = i * (barH + gap) + 4;
        const x0 = Math.min(zeroX, padL + ((c.composite - lo) / span) * (width - padL - 16));
        const x1 = Math.max(zeroX, padL + ((c.composite - lo) / span) * (width - padL - 16));
        return (
          <g key={i}>
            <text x={padL - 8} y={y + barH - 2} textAnchor="end" fontSize="10" fill={c.isYou ? P.ink : P.muted}>
              {i + 1}
            </text>
            <rect
              x={x0} y={y} width={Math.max(2, x1 - x0)} height={barH} rx="2.5"
              fill={c.isYou ? P.mine : P.neutral}
              stroke={c.isYou ? P.mineEdge : "none"} strokeWidth={c.isYou ? 1.5 : 0}
            />
            {c.isYou && (
              <text x={x1 + 7} y={y + barH - 2} fontSize="10.5" fill={P.mine} fontWeight="600">
                your team · {c.composite}
              </text>
            )}
          </g>
        );
      })}
      <text x={padL} y={h - 5} fontSize="10" fill={P.muted}>
        ranked by composite score · {cohort.length} team{cohort.length === 1 ? "" : "s"}
      </text>
    </svg>
  );
}

/**
 * The four variables as running totals across the four rounds.
 *
 * Section 8 calls this the most useful chart on the screen, and the reason is that a final number
 * cannot show WHICH round set it — a team that ended level may have spent three rounds recovering
 * from the first one.
 */
export function TrajectoryChart({ trajectory = [], labels = {}, width = 560, height = 220, theme = "dark" }) {
  const P = paletteFor(theme);
  if (!trajectory.length) return null;
  const keys = ["trust", "governance", "rigor", "exposure"];
  const padL = 34, padR = 12, padT = 12, padB = 26;
  const all = trajectory.flatMap((p) => keys.map((k) => p[k] ?? 0));
  const lo = Math.min(0, ...all);
  const hi = Math.max(1, ...all);
  const span = hi - lo || 1;
  const x = (i) => padL + (i / Math.max(1, trajectory.length - 1)) * (width - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / span) * (height - padT - padB);

  const ticks = [hi, Math.round((hi + lo) / 2), lo];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="res-svg"
      role="img" aria-label="Each variable's running total by round">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={width - padR} y2={y(t)} stroke={P.grid} />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="9.5" fill={P.muted}>{t}</text>
        </g>
      ))}
      {trajectory.map((p, i) => (
        <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill={P.muted}>
          R{p.round}
        </text>
      ))}
      {keys.map((k) => {
        const pts = trajectory.map((p, i) => `${x(i).toFixed(1)},${y(p[k] ?? 0).toFixed(1)}`);
        return (
          <g key={k}>
            <polyline points={pts.join(" ")} fill="none" stroke={P.varColor[k]} strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" />
            {trajectory.map((p, i) => (
              <circle key={i} cx={x(i)} cy={y(p[k] ?? 0)} r="3" fill={P.varColor[k]}>
                <title>{`${labels[k] || k} after R${p.round}: ${p[k] ?? 0}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Legend shared by the trajectory and radar, so the two charts read as one pair. */
export function VariableLegend({ labels = {}, theme = "dark" }) {
  const P = paletteFor(theme);
  const keys = ["trust", "governance", "rigor", "exposure"];
  return (
    <div className="res-legend">
      {keys.map((k) => (
        <span key={k}>
          <i style={{ background: P.varColor[k] }} />
          {labels[k] || k}
        </span>
      ))}
    </div>
  );
}

/**
 * The same four variables as a shape. Each axis is normalised against that variable's own possible
 * range, because the four do not share a scale — plotting raw points would make the variable with
 * the most decisions look dominant rather than strong.
 */
export function ResultsRadar({ variables = [], labels = {}, size = 230, theme = "dark" }) {
  const P = paletteFor(theme);
  if (variables.length < 3) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 42;
  const n = variables.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const at = (i, f) => [cx + Math.cos(angle(i)) * r * f, cy + Math.sin(angle(i)) * r * f];
  const frac = (v) => {
    const span = (v.max ?? 1) - (v.min ?? 0);
    if (span <= 0) return 0.5;
    return Math.max(0.04, Math.min(1, ((v.points ?? 0) - v.min) / span));
  };
  const pts = variables.map((v, i) => at(i, frac(v)));

  return (
    <svg
      width={size + 120}
      height={size + 16}
      viewBox={`-60 -8 ${size + 120} ${size + 16}`}
      className="res-svg"
      role="img"
      aria-label="Variable profile"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} fill="none" stroke={P.grid}
          points={variables.map((_, i) => at(i, f).map((c) => c.toFixed(1)).join(",")).join(" ")} />
      ))}
      {variables.map((_, i) => {
        const [px, py] = at(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke={P.grid} />;
      })}
      <polygon points={pts.map((p) => p.map((c) => c.toFixed(1)).join(",")).join(" ")}
        fill={P.fillMine} stroke={P.mine} strokeWidth="1.8" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill={P.varColor[variables[i].key] || P.mine}>
          <title>{`${labels[variables[i].key] || variables[i].key}: ${variables[i].points}`}</title>
        </circle>
      ))}
      {variables.map((v, i) => {
        const [px, py] = at(i, 1.22);
        const anchor = Math.abs(px - cx) < 12 ? "middle" : px > cx ? "start" : "end";
        const words = (labels[v.key] || v.key).split(" ");
        const lines = words.length > 1 ? [words.slice(0, -1).join(" "), words.slice(-1)[0]] : words;
        return (
          <text key={v.key} x={px} y={py} textAnchor={anchor} fontSize="9.5" fill={P.muted}>
            {lines.map((ln, k) => (<tspan key={k} x={px} dy={k === 0 ? 0 : 10}>{ln}</tspan>))}
          </text>
        );
      })}
    </svg>
  );
}
