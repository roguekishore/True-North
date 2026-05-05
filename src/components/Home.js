import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes needleSettle {
  0%   { transform: rotate(-50deg); }
  65%  { transform: rotate(16deg); }
  82%  { transform: rotate(-6deg); }
  100% { transform: rotate(10deg); }
}
@keyframes pulseRing {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes floatY {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-10px); }
}
@keyframes inkDraw {
  from { stroke-dashoffset: 700; }
  to   { stroke-dashoffset: 0; }
}
@keyframes heatPop {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes scanline {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes blink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0; }
}
@keyframes navSlide {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes gridFade {
  from { opacity: 0; }
  to   { opacity: 0.35; }
}
@keyframes lineGrow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

.tn-root {
  font-family: 'Space Mono', 'IBM Plex Mono', monospace;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

.tn-grid-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridFade 2s ease forwards;
}

.tn-scanline {
  position: fixed;
  left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,255,154,0.22), transparent);
  z-index: 1;
  pointer-events: none;
  animation: scanline 9s linear infinite;
}

/* NAV */
.tn-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 40px;
  height: 60px;
  transition: background 0.3s, border-color 0.3s;
  border-bottom: 1px solid transparent;
  animation: navSlide 0.5s ease 0.1s both;
}
.tn-nav.scrolled {
  background: rgba(5,5,5,0.92);
  backdrop-filter: blur(12px);
  border-bottom-color: var(--border);
}
.tn-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-right: auto;
}
.tn-nav-links {
  display: flex;
  align-items: center;
  gap: 36px;
  list-style: none;
}
.tn-nav-link {
  font-size: 12px;
  color: var(--muted);
  text-decoration: none;
  letter-spacing: 0.08em;
  position: relative;
  transition: color 0.18s;
}
.tn-nav-link::after {
  content: '';
  position: absolute;
  left: 0; bottom: -2px;
  width: 0; height: 1px;
  background: var(--accent);
  transition: width 0.22s ease;
}
.tn-nav-link:hover { color: var(--accent); }
.tn-nav-link:hover::after { width: 100%; }
.tn-nav-cta {
  background: var(--accent);
  color: var(--accent-contrast);
  border: none;
  padding: 7px 18px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
  text-decoration: none;
  display: inline-block;
  margin-left: 32px;
}
.tn-nav-cta:hover {
  background: #00FFB0;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0,255,154,0.25);
}

/* HERO */
.tn-hero {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 100px 40px 80px;
  max-width: 1200px;
  margin: 0 auto;
  gap: 64px;
}
.tn-hero-left {
  flex: 0 0 auto;
  max-width: 520px;
  animation: fadeUp 0.8s ease 0.15s both;
}
.tn-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-strong);
  padding: 5px 12px;
  margin-bottom: 28px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted-2);
}
.tn-eyebrow-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: blink 1.6s ease infinite;
}
.tn-h1 {
  font-size: clamp(38px, 5.5vw, 66px);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -0.01em;
  margin: 0 0 20px;
}
.tn-h1-accent { color: var(--accent); }
.tn-hero-sub {
  font-size: 15px;
  color: var(--muted);
  line-height: 1.75;
  max-width: 420px;
  margin: 0 0 36px;
  font-weight: 400;
}
.tn-hero-actions {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 52px;
}
.tn-btn-primary {
  background: var(--accent);
  color: var(--accent-contrast);
  border: none;
  padding: 13px 28px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.18s, transform 0.15s, box-shadow 0.2s;
  text-decoration: none;
  display: inline-block;
}
.tn-btn-primary:hover {
  background: #00FFB0;
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(0,255,154,0.28);
}
.tn-btn-ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border-strong);
  padding: 13px 24px;
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: border-color 0.18s, color 0.18s;
  text-decoration: none;
  display: inline-block;
}
.tn-btn-ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.tn-hero-stats {
  display: flex;
  gap: 40px;
  padding-top: 28px;
  border-top: 1px solid var(--border);
}
.tn-stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  margin-bottom: 5px;
}
.tn-stat-label {
  font-size: 11px;
  color: var(--muted-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Hero right */
.tn-hero-right {
  flex: 1;
  position: relative;
  min-height: 540px;
  animation: fadeUp 0.8s ease 0.35s both;
}

/* Preview cards */
.tn-card {
  background: var(--card);
  border: 1px solid var(--border);
}
.tn-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}
.tn-card-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--muted-2);
  text-transform: uppercase;
}

/* TICKER */
.tn-ticker-wrap {
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  padding: 15px 0;
  background: var(--panel);
}
.tn-ticker-track {
  display: flex;
  width: max-content;
  animation: marquee 26s linear infinite;
}
.tn-ticker-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 36px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-2);
  white-space: nowrap;
}
.tn-ticker-sep { color: var(--accent); opacity: 0.5; font-size: 14px; }

/* FEATURES */
.tn-features {
  position: relative;
  z-index: 2;
  padding: 100px 40px;
  max-width: 1200px;
  margin: 0 auto;
}
.tn-section-eyebrow {
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.tn-section-eyebrow::before { content: '◈ '; }
.tn-section-title {
  font-size: clamp(24px, 3.5vw, 40px);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
  margin: 0 0 56px;
}
.tn-section-title span { color: var(--muted-2); }
.tn-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: var(--border);
}
.tn-feature-card {
  background: var(--card);
  padding: 36px 28px;
  text-decoration: none;
  color: var(--text);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: background 0.2s, transform 0.22s, box-shadow 0.22s;
  border: 1px solid transparent;
}
.tn-feature-card:hover {
  background: var(--card-2);
  border-color: rgba(0,255,154,0.35);
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(0,255,154,0.07);
  z-index: 1;
}
.tn-feature-num {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--accent);
  text-transform: uppercase;
  margin-bottom: 18px;
}
.tn-feature-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0 0 12px;
}
.tn-feature-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.75;
  flex: 1;
  font-weight: 400;
}
.tn-feature-arrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-top: 22px;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.22s, transform 0.22s;
}
.tn-feature-card:hover .tn-feature-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* HOW IT WORKS */
.tn-how {
  position: relative;
  z-index: 2;
  background: var(--panel);
  padding: 100px 40px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.tn-how-inner { max-width: 1200px; margin: 0 auto; }
.tn-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: var(--border);
  margin-top: 56px;
}
.tn-step {
  background: var(--panel);
  padding: 40px 32px;
  position: relative;
  overflow: hidden;
}
.tn-step-watermark {
  position: absolute;
  right: 16px; top: 10px;
  font-size: 72px;
  font-weight: 700;
  color: rgba(0,255,154,0.05);
  line-height: 1;
  user-select: none;
  pointer-events: none;
}
.tn-step-bar {
  width: 32px; height: 1px;
  background: var(--accent);
  margin-bottom: 24px;
  transform-origin: left;
}
.tn-step-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin: 0 0 14px;
}
.tn-step-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.8;
  font-weight: 400;
}

/* QUOTE */
.tn-quote {
  position: relative;
  z-index: 2;
  padding: 80px 40px;
  text-align: center;
  border-bottom: 1px solid var(--border);
}
.tn-quote-inner { max-width: 700px; margin: 0 auto; }
.tn-quote-diamonds {
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.3em;
  margin-bottom: 28px;
}
.tn-quote-text {
  font-size: clamp(17px, 2.2vw, 25px);
  font-style: italic;
  color: var(--muted);
  line-height: 1.6;
  margin: 0 0 24px;
  font-weight: 400;
}
.tn-quote-attr {
  font-size: 11px;
  color: var(--muted-2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* CTA */
.tn-cta {
  position: relative;
  z-index: 2;
  background: var(--panel);
  padding: 100px 40px;
  text-align: center;
  border-bottom: 1px solid var(--border);
}
.tn-cta-glow {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 500px; height: 250px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.04;
  filter: blur(60px);
  pointer-events: none;
}
.tn-cta-inner {
  max-width: 540px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
.tn-cta-title {
  font-size: clamp(28px, 4.5vw, 50px);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.08;
  margin: 0 0 18px;
}
.tn-cta-sub {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.75;
  margin: 0 0 40px;
  font-weight: 400;
}
.tn-cta-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}

/* FOOTER */
.tn-footer {
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--border);
  padding: 28px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tn-footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted-2);
  text-decoration: none;
}
.tn-footer-links {
  display: flex;
  gap: 28px;
}
.tn-footer-links a {
  font-size: 11px;
  color: var(--muted-2);
  text-decoration: none;
  letter-spacing: 0.06em;
  transition: color 0.18s;
}
.tn-footer-links a:hover { color: var(--accent); }
.tn-footer-tagline {
  font-size: 11px;
  color: rgba(0,255,154,0.45);
  letter-spacing: 0.1em;
}

/* Responsive */
@media (max-width: 900px) {
  .tn-hero { flex-direction: column; padding: 100px 20px 60px; gap: 40px; }
  .tn-hero-right { min-height: 380px; width: 100%; }
  .tn-features-grid, .tn-steps { grid-template-columns: 1fr; }
  .tn-nav { padding: 0 20px; }
  .tn-nav-links { display: none; }
  .tn-features, .tn-cta { padding: 72px 20px; }
  .tn-how { padding: 72px 20px; }
  .tn-footer { flex-direction: column; gap: 16px; text-align: center; }
}
`;

/* ─── Compass ───────────────────────────────────────────── */
function Compass({ size = 196 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 500); return () => clearTimeout(t); }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 196 196" style={{ display: "block" }}>
      <circle cx="98" cy="98" r="92" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <circle cx="98" cy="98" r="80" fill="rgba(20,21,22,0.95)" stroke="rgba(0,255,154,0.18)" strokeWidth="1" />
      {mounted && (
        <circle cx="98" cy="98" r="80" fill="none" stroke="#00FF9A" strokeWidth="1"
          style={{ animation: "pulseRing 2.6s ease-out 0.8s infinite", opacity: 0.4 }}
        />
      )}
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * 10 * Math.PI) / 180;
        const major = i % 9 === 0, mid = i % 3 === 0;
        const r1 = major ? 70 : mid ? 73 : 75;
        return (
          <line key={i}
            x1={98 + r1 * Math.sin(a)} y1={98 - r1 * Math.cos(a)}
            x2={98 + 79 * Math.sin(a)} y2={98 - 79 * Math.cos(a)}
            stroke={major ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
            strokeWidth={major ? 1.2 : 0.6}
          />
        );
      })}
      {[["N",98,24],["S",98,178],["E",174,101],["W",23,101]].map(([l,x,y]) => (
        <text key={l} x={x} y={y} textAnchor="middle" fontSize="10"
          fontFamily="'Space Mono', monospace" fontWeight="700" letterSpacing="0.1em"
          fill={l === "N" ? "#00FF9A" : "rgba(255,255,255,0.35)"}
        >{l}</text>
      ))}
      {[0,45,90,135].map(deg => {
        const r = deg % 90 === 0 ? 52 : 44;
        const a = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={98 - r * Math.sin(a)} y1={98 - r * Math.cos(a)}
            x2={98 + r * Math.sin(a)} y2={98 + r * Math.cos(a)}
            stroke={deg % 90 === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}
            strokeWidth="0.7"
            strokeDasharray={deg % 90 !== 0 ? "3 4" : undefined}
          />
        );
      })}
      <g style={{
        transformOrigin: "98px 98px",
        animation: mounted ? "needleSettle 1.1s cubic-bezier(0.34,1.56,0.64,1) 0.6s both" : "none",
      }}>
        <polygon points="98,50 101.5,98 98,106 94.5,98" fill="#00FF9A" opacity="0.95" />
        <polygon points="98,146 101.5,98 98,90 94.5,98" fill="rgba(255,255,255,0.18)" />
      </g>
      <circle cx="98" cy="98" r="7" fill="#141516" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
      <circle cx="98" cy="98" r="3.5" fill="#00FF9A" />
    </svg>
  );
}

/* ─── Journal Card ──────────────────────────────────────── */
const JOURNAL_LINES = [
  { text: "> Today was a 7/10.", delay: 500 },
  { text: "> Woke at 06:30 — actually made it.", delay: 1000 },
  { text: "> Mood: calm. Anxiety: 2/10.", delay: 1600 },
  { text: "> Finished the morning pages.", delay: 2200 },
  { text: "> Habit streak: 14 days ✦", delay: 2900, accent: true },
];

function JournalCard() {
  const [lines, setLines] = useState([]);
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    JOURNAL_LINES.forEach(({ text, delay, accent }) => {
      setTimeout(() => setLines(p => [...p, { text, accent }]), delay);
    });
    const id = setInterval(() => setCursor(c => !c), 540);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="tn-card" style={{ animation: "fadeUp 0.7s ease 0.55s both" }}>
      <div className="tn-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["#ff5f57","#febc2e","rgba(0,255,154,0.55)"].map((c, i) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
          ))}
          <span style={{ marginLeft: 8, fontSize: 10, color: "var(--muted-2)", letterSpacing: "0.08em" }}>
            truenorth — journal.log
          </span>
        </div>
        <span style={{ fontSize: 10, color: "rgba(0,255,154,0.5)", letterSpacing: "0.08em" }}>● REC</span>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 10, color: "var(--muted-2)", marginBottom: 12, letterSpacing: "0.1em" }}>
          ◈ MAY 05, 2026 · 07:41
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{
            fontSize: 12.5,
            color: l.accent ? "var(--accent)" : "var(--muted)",
            marginBottom: 5,
            letterSpacing: "0.02em",
            animation: "fadeIn 0.3s ease both",
          }}>
            {l.text}
          </div>
        ))}
        {lines.length > 0 && (
          <span style={{
            display: "inline-block",
            width: 7, height: 13,
            background: cursor ? "var(--accent)" : "transparent",
            verticalAlign: "middle",
            marginLeft: 2,
            transition: "background 0.1s",
          }} />
        )}
      </div>
    </div>
  );
}

/* ─── Heatmap Card ──────────────────────────────────────── */
function HeatmapCard() {
  const weeks = 10, daysPerWeek = 7;
  const data = Array.from({ length: weeks * daysPerWeek }, (_, i) => {
    const p = i / (weeks * daysPerWeek);
    const r = Math.random();
    return r < 0.28 + p * 0.45 ? (r > 0.5 ? 1 : 0.55) : 0;
  });
  for (let i = 63; i < 70; i++) data[i] = Math.random() > 0.12 ? 1 : 0.55;

  return (
    <div className="tn-card" style={{ animation: "fadeUp 0.7s ease 0.75s both" }}>
      <div className="tn-card-header">
        <span className="tn-card-label">Habits</span>
        <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>✦ 14-day streak</span>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 10, color: "var(--muted-2)", letterSpacing: "0.1em", marginBottom: 10 }}>
          ◈ CONSISTENCY · LAST 10 WEEKS
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${weeks}, 1fr)`,
          gap: 3,
        }}>
          {data.map((v, i) => (
            <div key={i} style={{
              aspectRatio: "1",
              background: v === 1 ? "var(--accent)" : v === 0.55 ? "rgba(0,255,154,0.3)" : "var(--border)",
              animation: `heatPop 0.28s ease ${i * 7}ms both`,
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "var(--muted-2)" }}>Last 10 weeks</span>
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>↑ 78%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Mood Card ─────────────────────────────────────────── */
function MoodCard() {
  const pts = [4,5,6,5,7,6,8,7,8,9,8,9];
  const W = 200, H = 66, pad = 8, min = 3, max = 10;
  const tx = i => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const ty = v => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${tx(i)},${ty(v)}`).join(" ");
  const fill = `${line} L${tx(pts.length - 1)},${H} L${tx(0)},${H} Z`;

  return (
    <div className="tn-card" style={{ animation: "fadeUp 0.7s ease 0.9s both" }}>
      <div className="tn-card-header">
        <span className="tn-card-label">Mood</span>
        <span style={{ fontSize: 11, color: "var(--accent)" }}>↑ Trending up</span>
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ fontSize: 10, color: "var(--muted-2)", letterSpacing: "0.1em", marginBottom: 10 }}>
          ◈ LAST 12 DAYS
        </div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
          {[5,7].map(g => (
            <line key={g} x1={pad} y1={ty(g)} x2={W-pad} y2={ty(g)}
              stroke="var(--border)" strokeWidth="0.6" strokeDasharray="3 4" />
          ))}
          <path d={fill} fill="rgba(0,255,154,0.08)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="1.6"
            strokeLinejoin="round" strokeLinecap="round"
            strokeDasharray="700" strokeDashoffset="700"
            style={{ animation: "inkDraw 1.5s ease 1.1s forwards" }}
          />
          {pts.map((v, i) => (
            <circle key={i} cx={tx(i)} cy={ty(v)} r={i === pts.length - 1 ? 3.5 : 2}
              fill={i === pts.length - 1 ? "var(--accent)" : "var(--card)"}
              stroke="var(--accent)" strokeWidth="1.2"
            />
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 10, color: "var(--muted-2)" }}>Apr 23</span>
          <span style={{ fontSize: 10, color: "var(--muted-2)" }}>May 5</span>
        </div>
      </div>
    </div>
  );
}

/* ─── useInView ─────────────────────────────────────────── */
function useInView(ref, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

/* ─── Main ──────────────────────────────────────────────── */
const TICKER_ITEMS = ["Journal","Habits","Mood","Sleep","Energy","Gratitude","Goals","Reflections","Streaks","Insights","Trackers","Entries"];

const FEATURES = [
  { num: "01", title: "Daily Journal",      to: "/journal",      desc: "Capture thoughts, moods, and moments. Rich text entries with tagging, streaks, and mood tracking built in." },
  { num: "02", title: "Habit Tracker",      to: "/habit-tracker",desc: "Visual habit grids, streaks, and consistency heatmaps. Build the routines that shape your best self." },
  { num: "03", title: "Wellbeing Trackers", to: "/trackers",     desc: "Log mood, sleep, energy, anxiety, and more. Charts that reveal the patterns behind your mental state." },
];

export default function Home() {
  const featuresRef = useRef(null);
  const howRef      = useRef(null);
  const ctaRef      = useRef(null);
  const featuresInView = useInView(featuresRef);
  const howInView      = useInView(howRef);
  const ctaInView      = useInView(ctaRef);

  return (
    <div className="tn-root">
      <style>{CSS}</style>
      <div className="tn-grid-bg" />
      <div className="tn-scanline" />

      {/* ── HERO ── */}
      <section className="tn-hero">
        <div className="tn-hero-left">
          <div className="tn-eyebrow">
            <span className="tn-eyebrow-dot" />
            NOW IN BETA · V2.0
          </div>
          <h1 className="tn-h1">
            YOUR NORTH<br />
            <span className="tn-h1-accent">STAR.</span><br />
            EVERY DAY.
          </h1>
          <p className="tn-hero-sub">
            Journal, track habits, monitor wellbeing — all in one
            interface built for people who take their inner life seriously.
          </p>
          <div className="tn-hero-actions">
            <Link to="/journal" className="tn-btn-primary">START WRITING →</Link>
            <Link to="/entries" className="tn-btn-ghost">VIEW ENTRIES</Link>
          </div>
          <div className="tn-hero-stats">
            {[["10K+","Entries logged"],["94%","Streak retention"],["30+","Tracker types"]].map(([v,l]) => (
              <div key={l}>
                <div className="tn-stat-value">{v}</div>
                <div className="tn-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tn-hero-right">
          <div style={{ position: "absolute", top: 0, right: 0, animation: "floatY 5.5s ease-in-out infinite" }}>
            <Compass size={196} />
          </div>
          <div style={{ position: "absolute", top: 56, left: 0, width: "64%" }}>
            <JournalCard />
          </div>
          <div style={{ position: "absolute", bottom: 90, left: "8%", width: "52%" }}>
            <HeatmapCard />
          </div>
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "52%" }}>
            <MoodCard />
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="tn-ticker-wrap">
        <div className="tn-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="tn-ticker-item">
              {item}<span className="tn-ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section
        ref={featuresRef}
        className="tn-features"
        style={{
          opacity: featuresInView ? 1 : 0,
          transform: featuresInView ? "none" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <div className="tn-section-eyebrow">FEATURES</div>
        <h2 className="tn-section-title">
          EVERYTHING YOU NEED<br />
          <span>TO KNOW YOURSELF.</span>
        </h2>
        <div className="tn-features-grid">
          {FEATURES.map((f, i) => (
            <Link
              key={f.num}
              to={f.to}
              className="tn-feature-card"
              style={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? "none" : "translateY(20px)",
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s, background 0.2s, border-color 0.2s`,
              }}
            >
              <div className="tn-feature-num">{f.num}</div>
              <h3 className="tn-feature-title">{f.title.toUpperCase()}</h3>
              <p className="tn-feature-desc">{f.desc}</p>
              <span className="tn-feature-arrow">EXPLORE →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        ref={howRef}
        className="tn-how"
        style={{
          opacity: howInView ? 1 : 0,
          transform: howInView ? "none" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <div className="tn-how-inner">
          <div className="tn-section-eyebrow">HOW IT WORKS</div>
          <h2 className="tn-section-title">
            THREE STEPS TO<br />
            <span>CLARITY.</span>
          </h2>
          <div className="tn-steps">
            {[
              { n: "01", title: "LOG",   body: "Open the app. Write today's journal, check off habits, log your mood. Takes three mindful minutes." },
              { n: "02", title: "TRACK", body: "Every entry feeds into charts and heatmaps. Watch your patterns emerge over days and weeks." },
              { n: "03", title: "GROW",  body: "Insights surface what's working. Streaks, trends, and honest data to guide your next move." },
            ].map((s, i) => (
              <div
                key={s.n}
                className="tn-step"
                style={{
                  opacity: howInView ? 1 : 0,
                  transform: howInView ? "none" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
                }}
              >
                <div className="tn-step-watermark">{s.n}</div>
                <div
                  className="tn-step-bar"
                  style={{ animation: howInView ? `lineGrow 0.6s ease ${i * 0.12 + 0.3}s both` : "none" }}
                />
                <h3 className="tn-step-title">{s.title}</h3>
                <p className="tn-step-desc">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="tn-quote">
        <div className="tn-quote-inner">
          <div className="tn-quote-diamonds">◈ ◈ ◈</div>
          <blockquote className="tn-quote-text">
            "The unexamined life is not worth living — but the well-tracked one is worth repeating."
          </blockquote>
          <div className="tn-quote-attr">— TRUENORTH PHILOSOPHY</div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        ref={ctaRef}
        className="tn-cta"
        style={{
          opacity: ctaInView ? 1 : 0,
          transform: ctaInView ? "none" : "translateY(24px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <div className="tn-cta-glow" />
        <div className="tn-cta-inner">
          <div className="tn-section-eyebrow">GET STARTED TODAY</div>
          <h2 className="tn-cta-title">
            FIND YOUR<br />
            <span className="tn-h1-accent">TRUE NORTH.</span>
          </h2>
          <p className="tn-cta-sub">
            Free to start. No credit card required.<br />
            Your data stays private, always.
          </p>
          <div className="tn-cta-actions">
            <Link to="/journal" className="tn-btn-primary">START FREE →</Link>
            <Link to="/entries" className="tn-btn-ghost">VIEW ENTRIES</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="tn-footer">
        <Link to="/" className="tn-footer-logo">
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <polygon points="11,2 20,19 2,19" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
            <line x1="11" y1="2" x2="11" y2="12" stroke="var(--accent)" strokeWidth="1.4" />
            <circle cx="11" cy="12" r="1.5" fill="var(--accent)" />
          </svg>
          TRUENORTH © 2026
        </Link>
        <div className="tn-footer-links">
          {["Privacy","Terms","Support"].map(l => <a key={l} href="#">{l}</a>)}
        </div>
        <div className="tn-footer-tagline">BUILD SOMETHING REAL.</div>
      </footer>
    </div>
  );
}