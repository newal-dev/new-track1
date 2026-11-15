// Browser accessibility tests (axe-core + keyboard + zoom). Starts the plugin server and the demo site if they are not running.
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.js',
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/a11y-results.json' }]],
  use: { baseURL: 'http://localhost:8080', ...devices['Desktop Chrome'], permissions: [] },
  webServer: [
    { command: 'node server.js', url: 'http://localhost:3000/v1/health', reuseExistingServer: !process.env.CI, timeout: 30000 },
    { command: 'node tools/serve-demo.mjs', url: 'http://localhost:8080/index.html', reuseExistingServer: !process.env.CI, timeout: 30000 },
  ],
});
