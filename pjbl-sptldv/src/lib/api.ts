/**
 * Klien API — semua data diambil dari Worker (D1/R2).
 * TIDAK ADA data aplikasi yang disimpan di localStorage.
 */

export class GalatApi extends Error {
  status: number;
  data: any;
  constructor(pesan: string, status: number, data?: any) {
    super(pesan);
    this.status = status;
    this.data = data;
  }
}

async function tangani(res: Response) {
  const tipe = res.headers.get('content-type') || '';
  if (!tipe.includes('application/json')) {
    if (!res.ok) throw new GalatApi('Server sedang bermasalah. Coba lagi ya.', res.status);
    return null;
  }
  const data = await res.json();
  if (!res.ok) throw new GalatApi(data?.pesan || 'Terjadi kesalahan.', res.status, data);
  return data;
}

export async function ambil<T = any>(jalur: string): Promise<T> {
  const res = await fetch(`/api${jalur}`, { credentials: 'same-origin' });
  return (await tangani(res)) as T;
}

export async function kirim<T = any>(jalur: string, data?: any, metode = 'POST'): Promise<T> {
  const res = await fetch(`/api${jalur}`, {
    method: metode,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return (await tangani(res)) as T;
}

export async function kirimBerkas<T = any>(jalur: string, form: FormData): Promise<T> {
  const res = await fetch(`/api${jalur}`, { method: 'POST', credentials: 'same-origin', body: form });
  return (await tangani(res)) as T;
}

export async function hapus<T = any>(jalur: string): Promise<T> {
  const res = await fetch(`/api${jalur}`, { method: 'DELETE', credentials: 'same-origin' });
  return (await tangani(res)) as T;
}
