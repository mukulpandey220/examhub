import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Nyeras Nxtmove — High Concurrency Examination Load Test
 * Target Concurrency: 1,000 -> 5,000 -> 10,000 simulated participants
 * Scenarios:
 * 1. Synchronized Login & Session Startup
 * 2. Exam Content Retrieval & Question Preloading
 * 3. High-Frequency Autosave (every 30s debounced per student)
 * 4. Proctoring Heartbeat & Event Submission
 * 5. Final Submission Burst at Window Expiration
 */

export const options = {
  scenarios: {
    // Stage 1: Ramping up to 1,000 concurrent users
    smoke_and_baseline: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 500 },
        { duration: "2m", target: 1000 },
        { duration: "2m", target: 1000 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
    // Stage 2: Stress test to 5,000 and 10,000 participants
    high_concurrency_surge: {
      executor: "ramping-vus",
      startTime: "6m",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 2500 },
        { duration: "3m", target: 5000 },
        { duration: "4m", target: 10000 }, // Peak examination window surge
        { duration: "3m", target: 10000 }, // Sustained exam duration
        { duration: "2m", target: 0 },     // Final submission ramp down
      ],
      gracefulRampDown: "1m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],          // Less than 1% failure under peak load
    http_req_duration: ["p(95)<350", "p(99)<800"], // 95% of autosaves and submissions under 350ms
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:3000";

export default function () {
  const vuId = __VU;
  const examId = "exam-dotnet-mock-01";
  const userId = `load-test-student-${vuId}`;

  // 1. Authenticate / Initialize Attempt
  const startPayload = JSON.stringify({
    userId,
    userName: `Load Test Student ${vuId}`,
    userEmail: `student${vuId}@bmsce.ac.in`,
  });

  const startRes = http.post(`${BASE_URL}/api/assessments/exams/${examId}/start`, startPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(startRes, {
    "start attempt status is 200": (r) => r.status === 200,
  });

  const attemptData = startRes.json();
  const attemptId = attemptData && attemptData.attempt ? attemptData.attempt.id : `att-load-${vuId}`;

  sleep(1);

  // 2. Periodic Autosave Simulation (Every 10-15s per simulated participant)
  for (let i = 1; i <= 3; i++) {
    const autosavePayload = JSON.stringify({
      attemptId,
      answers: {
        "q-01": `opt-${(i % 4) + 1}`,
        "q-02": `opt-${((i + 1) % 4) + 1}`,
      },
      timeSpentSeconds: i * 30,
    });

    const autoRes = http.post(`${BASE_URL}/api/assessments/exams/${examId}/autosave`, autosavePayload, {
      headers: { "Content-Type": "application/json" },
    });

    check(autoRes, {
      "autosave accepted in < 250ms": (r) => r.status === 200 && r.timings.duration < 250,
    });

    // 3. Proctoring Heartbeat / Integrity Event
    const eventPayload = JSON.stringify({
      eventId: `ev-load-${vuId}-${i}-${Date.now()}`,
      attemptId,
      examId,
      studentId: userId,
      eventType: "window_focus",
      occurredAt: new Date().toISOString(),
    });

    const eventRes = http.post(`${BASE_URL}/api/v1/proctoring/events`, eventPayload, {
      headers: { "Content-Type": "application/json" },
    });

    check(eventRes, {
      "proctoring event logged": (r) => r.status === 200,
    });

    sleep(2);
  }

  // 4. Final Submission
  const submitPayload = JSON.stringify({
    attemptId,
    answers: {
      "q-01": "opt-1",
      "q-02": "opt-2",
      "q-03": "opt-3",
    },
  });

  const submitRes = http.post(`${BASE_URL}/api/assessments/exams/${examId}/submit`, submitPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(submitRes, {
    "submission finalized successfully": (r) => r.status === 200,
  });

  sleep(1);
}
