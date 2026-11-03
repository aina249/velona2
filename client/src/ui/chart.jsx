import React, { useCallback, useRef, useState } from 'react';
import { fmtShort, num } from '../lib/util';

function useWidth(initial) {
  const [w, setW] = useState(initial);
  const ro = useRef(null);
  // Ref « callback » : observe l'élément réellement affiché, même s'il change
  const ref = useCallback((node) => {
    if (ro.current) { ro.current.disconnect(); ro.current = null; }
    if (!node) return;
    if (node.clientWidth > 0) setW(node.clientWidth);
    if (typeof ResizeObserver !== 'undefined') {
      ro.current = new ResizeObserver(([e]) => { const cw = Math.round(e.contentRect.width); if (cw > 0) setW(cw); });
      ro.current.observe(node);
    }
  }, []);
  return [ref, w];
}

// Courbe d'évolution : points [{ x: date, y: valeur }], ligne d'objectif facultative
export function LineChart({ points, target, unit = '', height = 220, color = 'var(--green)', label = 'Évolution' }) {
  const [hover, setHover] = useState(null);
  const [box, width] = useWidth(640);
  const data = points.filter((p) => p.y !== null && p.y !== undefined && !Number.isNaN(p.y));
  if (data.length === 0) return <p className="muted chart-empty" ref={box}>Pas encore de relevé.</p>;
  const W = Math.max(280, width); const H = height; const L = 44; const R = 16; const T = 16; const B = 30;
  const ys = data.map((p) => p.y).concat(target !== null && target !== undefined ? [target] : []);
  let min = Math.min(...ys); let max = Math.max(...ys);
  const pad = Math.max((max - min) * 0.15, 0.5);
  min -= pad; max += pad;
  const xs = data.map((p) => new Date(p.x).getTime());
  const x0 = Math.min(...xs); const x1 = Math.max(...xs);
  const sx = (t) => (x1 === x0 ? (L + W - R) / 2 : L + ((t - x0) / (x1 - x0)) * (W - L - R));
  const sy = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const ticks = 4;
  const path = data.map((p, i) => `${i ? 'L' : 'M'}${sx(xs[i]).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${sx(xs[xs.length - 1]).toFixed(1)},${H - B} L${sx(xs[0]).toFixed(1)},${H - B} Z`;
  const step = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(W / 110))));
  const first = data[0].y; const last = data[data.length - 1].y;
  return (
    <figure className="chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} : de ${num(first)} à ${num(last)} ${unit}`} preserveAspectRatio="none">
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = min + ((max - min) * i) / ticks;
          return <g key={i}><line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className="grid" /><text x={L - 8} y={sy(v) + 4} textAnchor="end" className="axis">{num(v, 1)}</text></g>;
        })}
        {target !== null && target !== undefined ? (
          <g><line x1={L} x2={W - R} y1={sy(target)} y2={sy(target)} className="target" /><text x={W - R} y={sy(target) - 6} textAnchor="end" className="target-label">Objectif {num(target)} {unit}</text></g>
        ) : null}
        <path d={area} fill={color} opacity="0.08" />
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((p, i) => (
          <g key={i}>
            <circle cx={sx(xs[i])} cy={sy(p.y)} r={hover === i ? 6 : 4} fill="#fff" stroke={color} strokeWidth="2.5" />
            <rect x={sx(xs[i]) - 14} y={T} width="28" height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onTouchStart={() => setHover(i)} />
            {i % step === 0 || i === data.length - 1 ? <text x={sx(xs[i])} y={H - 8} textAnchor="middle" className="axis">{fmtShort(p.x)}</text> : null}
          </g>
        ))}
        {hover !== null ? (
          <g pointerEvents="none">
            <rect x={Math.min(Math.max(sx(xs[hover]) - 52, L), W - R - 104)} y={Math.max(sy(data[hover].y) - 44, 2)} width="104" height="32" rx="8" className="tip" />
            <text x={Math.min(Math.max(sx(xs[hover]), L + 52), W - R - 52)} y={Math.max(sy(data[hover].y) - 23, 23)} textAnchor="middle" className="tip-text">{num(data[hover].y)} {unit} · {fmtShort(data[hover].x)}</text>
          </g>
        ) : null}
      </svg>
    </figure>
  );
}

// Barres simples (revenus mensuels)
export function BarChart({ data, format = (v) => v, height = 180 }) {
  const [box, width] = useWidth(600);
  const W = Math.max(280, width); const H = height; const B = 26; const T = 22;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W / data.length) * 0.56;
  return (
    <figure className="chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.map((d) => `${d.label} : ${format(d.value)}`).join(', ')}>
        {data.map((d, i) => {
          const cx = (W / data.length) * (i + 0.5);
          const h = ((H - B - T) * d.value) / max;
          const lastOne = i === data.length - 1;
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={H - B - h} width={bw} height={Math.max(h, 2)} rx="6" className={lastOne ? 'bar bar-current' : 'bar'} />
              {d.value ? <text x={cx} y={H - B - h - 6} textAnchor="middle" className="axis">{format(d.value)}</text> : null}
              <text x={cx} y={H - 6} textAnchor="middle" className="axis">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
