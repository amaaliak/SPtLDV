/**
 * SERVER PENGEMBANGAN LOKAL
 * -------------------------------------------------------------------
 * Menjalankan Worker Hono yang SAMA PERSIS dengan yang dideploy ke
 * Cloudflare, tetapi dengan:
 *   - binding DB  -> tiruan D1 di atas SQLite (better-sqlite3)
 *   - binding R2  -> tiruan R2 di atas berkas lokal (dev/.data/r2)
 *
 * Di produksi (Cloudflare Pages/Workers) binding asli D1 & R2 dipakai,
 * kode aplikasi tidak berubah sedikit pun.
 */
import { serve } from '@hono/node-server';
import Database from 'better-sqlite3';
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AKAR = path.resolve(__dirname, '..');
const DATA = path.join(__dirname, '.data');
const R2_DIR = path.join(DATA, 'r2');
const DB_FILE = path.join(DATA, 'pjbl.sqlite');
const PORT = Number(process.env.API_PORT || 8787);

fs.mkdirSync(R2_DIR, { recursive: true });

/* ----------------------- Tiruan D1 di atas SQLite ----------------------- */

const sqlite = new Database(DB_FILE);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Terapkan skema
const skema = fs.readFileSync(path.join(AKAR, 'schema.sql'), 'utf8');
sqlite.exec(skema);

function bersihkanArg(v) {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === undefined) return null;
  return v;
}

class D1Statement {
  constructor(db, sql, args = []) {
    this.db = db;
    this.sql = sql;
    this.args = args;
  }
  bind(...args) {
    return new D1Statement(this.db, this.sql, args.map(bersihkanArg));
  }
  #stmt() {
    return this.db.prepare(this.sql);
  }
  async all() {
    const st = this.#stmt();
    if (st.reader) {
      const results = st.all(...this.args);
      return { results, success: true, meta: { rows_read: results.length } };
    }
    const info = st.run(...this.args);
    return {
      results: [],
      success: true,
      meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) },
    };
  }
  async first(kolom) {
    const st = this.#stmt();
    if (!st.reader) {
      st.run(...this.args);
      return null;
    }
    const row = st.get(...this.args) ?? null;
    if (row && kolom) return row[kolom];
    return row;
  }
  async run() {
    const st = this.#stmt();
    if (st.reader) {
      const results = st.all(...this.args);
      return { success: true, results, meta: { changes: 0, last_row_id: 0, rows_read: results.length } };
    }
    const info = st.run(...this.args);
    return {
      success: true,
      results: [],
      meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid), duration: 0 },
    };
  }
  async raw() {
    const st = this.#stmt();
    return st.raw().all(...this.args);
  }
}

const DB = {
  prepare: (sql) => new D1Statement(sqlite, sql),
  async batch(stmts) {
    const out = [];
    const trx = sqlite.transaction(() => {});
    trx();
    for (const s of stmts) out.push(await s.run());
    return out;
  },
  async exec(sql) {
    sqlite.exec(sql);
    return { count: 1, duration: 0 };
  },
};

/* --------------------- Tiruan R2 di atas berkas lokal ------------------- */

const jalurAman = (kunci) => path.join(R2_DIR, kunci.replace(/\.\./g, '_'));

const R2 = {
  async put(kunci, data, opsi = {}) {
    const p = jalurAman(kunci);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const buf = Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
    fs.writeFileSync(p, buf);
    fs.writeFileSync(`${p}.meta.json`, JSON.stringify({ httpMetadata: opsi.httpMetadata || {} }));
    return { key: kunci, size: buf.length, uploaded: new Date() };
  },
  async get(kunci) {
    const p = jalurAman(kunci);
    if (!fs.existsSync(p)) return null;
    const buf = fs.readFileSync(p);
    let meta = {};
    try {
      meta = JSON.parse(fs.readFileSync(`${p}.meta.json`, 'utf8'));
    } catch {
      /* tanpa metadata */
    }
    return {
      key: kunci,
      size: buf.length,
      body: new Uint8Array(buf),
      httpMetadata: meta.httpMetadata || {},
      async arrayBuffer() {
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      },
      writeHttpMetadata(headers) {
        if (meta.httpMetadata?.contentType) headers.set('Content-Type', meta.httpMetadata.contentType);
      },
    };
  },
  async delete(kunci) {
    const p = jalurAman(kunci);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    if (fs.existsSync(`${p}.meta.json`)) fs.unlinkSync(`${p}.meta.json`);
  },
  async list() {
    return { objects: [], truncated: false };
  },
};

const ENV = {
  DB,
  R2,
  NAMA_APLIKASI: 'PjBL SPtLDV — Tata Boga (lokal)',
  ZONA_WAKTU: 'Asia/Jakarta',
};

/* ------------------- Bundel worker (TypeScript) & muat ------------------ */

const KELUARAN = path.join(DATA, 'worker-bundle.mjs');
let app = null;

async function bangunDanMuat() {
  await esbuild.build({
    entryPoints: [path.join(AKAR, 'worker/src/app.ts')],
    outfile: KELUARAN,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    logLevel: 'silent',
    external: ['better-sqlite3'],
  });
  const mod = await import(`file://${KELUARAN}?v=${Date.now()}`);
  app = mod.default;
}

await bangunDanMuat();

// Muat ulang otomatis saat kode backend berubah
let jeda = null;
for (const dir of ['worker', 'shared']) {
  fs.watch(path.join(AKAR, dir), { recursive: true }, () => {
    clearTimeout(jeda);
    jeda = setTimeout(async () => {
      try {
        await bangunDanMuat();
        console.log('[api] kode backend dimuat ulang ✔');
      } catch (e) {
        console.error('[api] gagal memuat ulang:', e.message);
      }
    }, 250);
  });
}

/* ------------------------------- Jalankan ------------------------------- */

serve({ fetch: (req) => app.fetch(req, ENV, { waitUntil: () => {}, passThroughOnException: () => {} }), port: PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(`[api] Worker lokal (D1+R2 tiruan) berjalan di http://127.0.0.1:${info.port}`);
  console.log(`[api] Basis data: ${DB_FILE}`);
});
