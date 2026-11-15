// Serves demo-host/ on port 8080 without Docker (the same job nginx does in docker-compose.yml).
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'demo-host');
const port = +process.env.DEMO_PORT || 8080;
express().use(express.static(root)).listen(port, () => console.log(`Demo host site on http://localhost:${port}`));
