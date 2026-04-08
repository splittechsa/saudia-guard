import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 500 },  // Ramp up to 500 users
    { duration: '30s', target: 500 }, // Stay at 500 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1000ms
  },
};

export default function () {
  // Test Dashboard page
  let response = http.get('http://localhost:8080/');
  check(response, {
    'Dashboard status is 200': (r) => r.status === 200,
    'Dashboard response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Simulate AI analysis function call (assuming it's a POST to a function)
  // Since we don't have auth, just test the endpoint if possible
  // For demo, test a Supabase function if accessible
  // Replace with actual endpoint
  // let aiResponse = http.post('https://oolubvzjmfalxgmjvjkx.supabase.co/functions/v1/ai-support-chat', {}, {
  //   headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  // });
  // check(aiResponse, {
  //   'AI analysis status is 200': (r) => r.status === 200,
  //   'AI analysis response time < 1000ms': (r) => r.timings.duration < 1000,
  // });

  sleep(1); // Wait 1 second between iterations
}