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
          <title>{`${labels[keys[i]]}: ${values[keys[i]]}`}</title>
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

export function ordinal(n) {
  if (n == null) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
