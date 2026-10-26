// Flash sale: 300 requests per second for one hot product.
// DURATION is set by ./lab (long for `break`, 40s for `check`).
import http from 'k6/http';

export const options = {
  scenarios: {
    flash_sale: {
      executor: 'constant-arrival-rate',
      rate: 300,
      timeUnit: '1s',
      duration: __ENV.DURATION || '40s',
      preAllocatedVUs: 300,
      maxVUs: 600,
    },
  },
  summaryTrendStats: ['p(50)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  http.get('http://app:8000/products/42/summary', { timeout: '10s' });
}
