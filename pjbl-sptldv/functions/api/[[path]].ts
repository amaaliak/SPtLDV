/**
 * Cloudflare Pages Functions — meneruskan semua permintaan /api/*
 * ke aplikasi Hono (Worker) yang sama.
 */
import { handle } from 'hono/cloudflare-pages';
import app from '../../worker/src/app';

export const onRequest = handle(app);
