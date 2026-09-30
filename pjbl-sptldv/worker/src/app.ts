/**
 * Aplikasi API (Cloudflare Worker) — Hono.
 * Seluruh endpoint berada di bawah /api.
 */
import { Hono } from 'hono';
import type { Variabel } from './types';
import { auth, muatSesi } from './routes/auth';
import { siswa } from './routes/siswa';
import { guru } from './routes/guru';

const app = new Hono<Variabel>().basePath('/api');

app.use('*', muatSesi);

app.get('/health', (c) => c.json({ ok: true, waktu: new Date().toISOString() }));

app.route('/', auth);
app.route('/', siswa);
app.route('/guru', guru);

app.notFound((c) => c.json({ pesan: 'Endpoint tidak ditemukan.' }, 404));

app.onError((err, c) => {
  console.error('[API]', err);
  return c.json(
    { pesan: 'Terjadi kesalahan di server. Coba lagi beberapa saat lagi.', detail: String(err?.message || err) },
    500,
  );
});

export default app;
