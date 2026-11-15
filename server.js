import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

// In memory only: nothing leaves this host. Demo has no auth (add real auth before production).
const pub = new Map();
const priv = new Map(); // support answers: separate store, never returned by any route
const jobs = [
  { id: 1, title: 'Customer support agent', titleAm: 'የደንበኞች አገልግሎት ሠራተኛ', offers: ['remote', 'hours'] },
  { id: 2, title: 'Data entry clerk', titleAm: 'የመረጃ ማስገቢያ ሠራተኛ', offers: ['stepfree', 'reader'] },
];

const save = (flow, first) => (req, res) => {
  const { support, needs, offers, ...rest } = req.body || {};
  if (!rest[first])
    return res.status(422).json({ error: { code: 'validation_failed', message: first + ' is required' } });
  const id = randomUUID();
  pub.set(id, { flow, ...rest });
  if (support || needs) priv.set(id, support || needs);
  if (flow === 'employer' && Array.isArray(offers)) jobs.push({ id: jobs.length + 1, title: rest.job, offers });
  res.status(201).json({ id });
};

app.get('/', (q, r) => r.type('text').send('Inclusive Access plugin server.\nPlugin script: /db-form.js\nAPI: /v1/health and /v1/jobs\nDemo partner site: http://localhost:8080'));
app.get('/v1/health', (q, r) => r.json({ ok: true }));
app.get('/v1/jobs', (q, r) => r.json(jobs));
app.post('/v1/learners', save('signup', 'fullName'));
app.post('/v1/applications', save('job', 'role'));
app.post('/v1/employer/jobs', save('employer', 'job'));

app.listen(3000, () => console.log('Plugin server on http://localhost:3000. Demo host site: http://localhost:8080'));