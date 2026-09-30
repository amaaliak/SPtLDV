import { useMemo, useState } from 'react';
import {
  batasOtomatis,
  daerahPenyelesaian,
  nilaiOptimum,
  titikPojok,
  tulisKendala,
  type Kendala,
  type Titik,
} from '../../shared/linear';

/**
 * BIDANG KOORDINAT INTERAKTIF — dibuat sendiri dengan SVG murni.
 * Tidak memakai GeoGebra atau pustaka grafik eksternal apa pun.
 */

export const WARNA_GARIS = ['#F97316', '#0EA5E9', '#A855F7', '#EF4444', '#14B8A6', '#EAB308', '#EC4899'];

interface Props {
  kendala: Kendala[];
  labelX?: string;
  labelY?: string;
  tujuan?: { a: number; b: number } | null;
  tampilkanOptimum?: boolean;
  xMaks?: number;
  yMaks?: number;
  tinggi?: number;
  judul?: string;
  tampilkanLegenda?: boolean;
  satuanZ?: (n: number) => string;
}

function langkahRapi(kasar: number): number {
  const pangkat = Math.pow(10, Math.floor(Math.log10(Math.max(kasar, 1e-9))));
  const sisa = kasar / pangkat;
  const pilih = sisa > 5 ? 10 : sisa > 2 ? 5 : sisa > 1 ? 2 : 1;
  return pilih * pangkat;
}

export default function BidangKoordinat({
  kendala,
  labelX = 'x',
  labelY = 'y',
  tujuan = null,
  tampilkanOptimum = false,
  xMaks: xM,
  yMaks: yM,
  tinggi = 420,
  judul,
  tampilkanLegenda = true,
  satuanZ,
}: Props) {
  const [dipilih, setDipilih] = useState<Titik | null>(null);

  const auto = useMemo(() => batasOtomatis(kendala), [kendala]);
  const xMaks = xM ?? auto.xMaks;
  const yMaks = yM ?? auto.yMaks;

  const L = 58;
  const R = 22;
  const A = 22;
  const B = 56;
  const W = 660;
  const H = tinggi;
  const lebarPlot = W - L - R;
  const tinggiPlot = H - A - B;

  const px = (x: number) => L + (x / xMaks) * lebarPlot;
  const py = (y: number) => A + tinggiPlot - (y / yMaks) * tinggiPlot;

  const daerah = useMemo(
    () => daerahPenyelesaian(kendala, { xMin: 0, xMaks, yMin: 0, yMaks }),
    [kendala, xMaks, yMaks],
  );
  const pojok = useMemo(() => titikPojok(kendala).filter((t) => t.x <= xMaks * 1.001 && t.y <= yMaks * 1.001), [
    kendala,
    xMaks,
    yMaks,
  ]);
  const optimum = useMemo(
    () => (tujuan && tampilkanOptimum ? nilaiOptimum(kendala, tujuan, 'maks') : null),
    [kendala, tujuan, tampilkanOptimum],
  );

  const langkahX = langkahRapi(xMaks / 8);
  const langkahY = langkahRapi(yMaks / 8);
  const tikX: number[] = [];
  for (let v = 0; v <= xMaks + 1e-9; v += langkahX) tikX.push(Number(v.toFixed(6)));
  const tikY: number[] = [];
  for (let v = 0; v <= yMaks + 1e-9; v += langkahY) tikY.push(Number(v.toFixed(6)));

  /** Ruas garis pembatas di dalam kotak tampilan. */
  function ruasGaris(k: Kendala): [Titik, Titik] | null {
    const kandidat: Titik[] = [];
    const tambah = (t: Titik) => {
      if (t.x >= -1e-6 && t.x <= xMaks + 1e-6 && t.y >= -1e-6 && t.y <= yMaks + 1e-6) kandidat.push(t);
    };
    if (Math.abs(k.b) > 1e-9) {
      tambah({ x: 0, y: k.c / k.b });
      tambah({ x: xMaks, y: (k.c - k.a * xMaks) / k.b });
    }
    if (Math.abs(k.a) > 1e-9) {
      tambah({ x: k.c / k.a, y: 0 });
      tambah({ x: (k.c - k.b * yMaks) / k.a, y: yMaks });
    }
    if (kandidat.length < 2) return null;
    let p1 = kandidat[0];
    let p2 = kandidat[0];
    let maks = -1;
    for (let i = 0; i < kandidat.length; i++) {
      for (let j = i + 1; j < kandidat.length; j++) {
        const d = Math.hypot(kandidat[i].x - kandidat[j].x, kandidat[i].y - kandidat[j].y);
        if (d > maks) {
          maks = d;
          p1 = kandidat[i];
          p2 = kandidat[j];
        }
      }
    }
    return maks <= 1e-9 ? null : [p1, p2];
  }

  const jalurDaerah =
    daerah.length >= 3 ? daerah.map((t, i) => `${i === 0 ? 'M' : 'L'}${px(t.x)},${py(t.y)}`).join(' ') + ' Z' : '';

  const fmt = (n: number) =>
    Math.abs(n) >= 1000 ? n.toLocaleString('id-ID', { maximumFractionDigits: 0 }) : String(Number(n.toFixed(2)));

  return (
    <div className="w-full">
      {judul && <p className="mb-2 text-sm font-bold text-oranye-800">{judul}</p>}
      <div className="overflow-hidden rounded-2xl border-2 border-oranye-100 bg-white">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-manipulation select-none"
          role="img"
          aria-label="Grafik daerah penyelesaian sistem pertidaksamaan linear dua variabel"
        >
          <defs>
            <marker id="panah" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#7C2D12" />
            </marker>
            <pattern id="arsir" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y="0" x2="0" y2="8" stroke="#22C55E" strokeWidth="3" opacity="0.25" />
            </pattern>
          </defs>

          <rect x={0} y={0} width={W} height={H} fill="#FFFDF9" />

          {/* Garis kisi */}
          {tikX.map((v) => (
            <line key={`gx${v}`} x1={px(v)} y1={A} x2={px(v)} y2={A + tinggiPlot} stroke="#FFEDD5" strokeWidth={1} />
          ))}
          {tikY.map((v) => (
            <line key={`gy${v}`} x1={L} y1={py(v)} x2={L + lebarPlot} y2={py(v)} stroke="#FFEDD5" strokeWidth={1} />
          ))}

          {/* Daerah penyelesaian */}
          {jalurDaerah && (
            <>
              <path d={jalurDaerah} fill="#22C55E" fillOpacity={0.18} stroke="#16A34A" strokeWidth={2} strokeDasharray="6 3" />
              <path d={jalurDaerah} fill="url(#arsir)" />
            </>
          )}

          {/* Garis pembatas tiap pertidaksamaan */}
          {kendala.map((k, i) => {
            const r = ruasGaris(k);
            if (!r) return null;
            const warna = k.warna || WARNA_GARIS[i % WARNA_GARIS.length];
            const putus = k.op === '<' || k.op === '>';
            return (
              <g key={`k${i}`}>
                <line
                  x1={px(r[0].x)}
                  y1={py(r[0].y)}
                  x2={px(r[1].x)}
                  y2={py(r[1].y)}
                  stroke={warna}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={putus ? '8 5' : undefined}
                />
              </g>
            );
          })}

          {/* Sumbu */}
          <line x1={L} y1={A + tinggiPlot} x2={L + lebarPlot + 10} y2={A + tinggiPlot} stroke="#7C2D12" strokeWidth={2.5} markerEnd="url(#panah)" />
          <line x1={L} y1={A + tinggiPlot} x2={L} y2={A - 10} stroke="#7C2D12" strokeWidth={2.5} markerEnd="url(#panah)" />

          {/* Skala sumbu X */}
          {tikX.map((v) => (
            <g key={`tx${v}`}>
              <line x1={px(v)} y1={A + tinggiPlot} x2={px(v)} y2={A + tinggiPlot + 6} stroke="#7C2D12" strokeWidth={1.5} />
              <text x={px(v)} y={A + tinggiPlot + 22} textAnchor="middle" fontSize={13} fill="#9A3412" fontWeight={600}>
                {fmt(v)}
              </text>
            </g>
          ))}
          {/* Skala sumbu Y */}
          {tikY.map((v) => (
            <g key={`ty${v}`}>
              <line x1={L - 6} y1={py(v)} x2={L} y2={py(v)} stroke="#7C2D12" strokeWidth={1.5} />
              <text x={L - 10} y={py(v) + 4} textAnchor="end" fontSize={13} fill="#9A3412" fontWeight={600}>
                {fmt(v)}
              </text>
            </g>
          ))}

          {/* Nama sumbu */}
          <text x={L + lebarPlot / 2} y={H - 12} textAnchor="middle" fontSize={14} fontWeight={700} fill="#7C2D12">
            {labelX}
          </text>
          <text
            x={16}
            y={A + tinggiPlot / 2}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="#7C2D12"
            transform={`rotate(-90 16 ${A + tinggiPlot / 2})`}
          >
            {labelY}
          </text>

          {/* Titik pojok (bisa diklik) */}
          {pojok.map((t, i) => {
            const aktif = dipilih && Math.abs(dipilih.x - t.x) < 1e-6 && Math.abs(dipilih.y - t.y) < 1e-6;
            const juara =
              optimum?.titik && Math.abs(optimum.titik.x - t.x) < 1e-6 && Math.abs(optimum.titik.y - t.y) < 1e-6;
            return (
              <g key={`p${i}`} onClick={() => setDipilih(aktif ? null : t)} style={{ cursor: 'pointer' }}>
                <circle cx={px(t.x)} cy={py(t.y)} r={16} fill="transparent" />
                <circle
                  cx={px(t.x)}
                  cy={py(t.y)}
                  r={juara ? 9 : 6.5}
                  fill={juara ? '#EAB308' : '#fff'}
                  stroke={juara ? '#A16207' : '#16A34A'}
                  strokeWidth={3}
                />
                {aktif && (
                  <g>
                    <rect
                      x={Math.min(px(t.x) + 10, W - 130)}
                      y={Math.max(py(t.y) - 46, 4)}
                      width={124}
                      height={tujuan ? 42 : 26}
                      rx={8}
                      fill="#7C2D12"
                      opacity={0.95}
                    />
                    <text
                      x={Math.min(px(t.x) + 18, W - 122)}
                      y={Math.max(py(t.y) - 28, 22)}
                      fontSize={13}
                      fill="#fff"
                      fontWeight={700}
                    >
                      ({fmt(t.x)} , {fmt(t.y)})
                    </text>
                    {tujuan && (
                      <text
                        x={Math.min(px(t.x) + 18, W - 122)}
                        y={Math.max(py(t.y) - 12, 38)}
                        fontSize={12}
                        fill="#FDBA74"
                        fontWeight={600}
                      >
                        Z = {satuanZ ? satuanZ(tujuan.a * t.x + tujuan.b * t.y) : fmt(tujuan.a * t.x + tujuan.b * t.y)}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Penanda titik optimum */}
          {optimum?.titik && (
            <g>
              <text x={px(optimum.titik.x)} y={py(optimum.titik.y) - 14} textAnchor="middle" fontSize={18}>
                ⭐
              </text>
            </g>
          )}

          {daerah.length < 3 && (
            <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={15} fill="#EF4444" fontWeight={700}>
              Tidak ada daerah penyelesaian untuk kombinasi ini.
            </text>
          )}
        </svg>
      </div>

      {tampilkanLegenda && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {kendala.map((k, i) => (
              <span
                key={`l${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-kartu"
                style={{ color: k.warna || WARNA_GARIS[i % WARNA_GARIS.length] }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: k.warna || WARNA_GARIS[i % WARNA_GARIS.length] }}
                />
                {k.label ? `${k.label}: ` : ''}
                {tulisKendala(k)}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-hijau-50 px-3 py-1 text-xs font-semibold text-hijau-700">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-hijau-400/50" /> Daerah penyelesaian
            </span>
          </div>
          <p className="text-xs text-oranye-600">
            💡 Ketuk titik pojok (lingkaran hijau) untuk melihat koordinatnya
            {tujuan ? ' dan nilai Z-nya' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}
