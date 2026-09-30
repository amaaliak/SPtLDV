#!/usr/bin/env bash
# Menjalankan aplikasi PjBL SPtLDV.
# Memasang dependensi lebih dulu bila folder node_modules belum ada
# (folder ini memang tidak ikut tersimpan pada snapshot workspace).
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "[mulai] node_modules belum ada — memasang dependensi…"
  npm install --no-audit --no-fund --silent
fi

if [ ! -f dev/.data/pjbl.sqlite ]; then
  echo "[mulai] basis data lokal belum ada — mengisi data contoh…"
  node dev/seed.mjs
fi

echo "[mulai] menjalankan API (:8787) + web (:5173)…"
exec npm run dev
