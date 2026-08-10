import http from "k6/http";
import { check, sleep } from "k6";

// ============================================================================
// PERFORMANCE TEST CONFIGURATION & REQUIREMENTS
// ============================================================================
export const options = {
    // Requirement 1: Simulate at least 20 Virtual Users (VUs)
    stages: [
        { duration: "15s", target: 20 }, // Ramp-up to 20 VUs over 15 seconds
        { duration: "30s", target: 20 }, // Sustain 20 VUs load for 30 seconds
        { duration: "15s", target: 0 }, // Ramp-down back to 0 VUs
    ],

    // Requirement 2: Define a Threshold (95% of requests fulfilled under 500ms)
    thresholds: {
        http_req_duration: ["p(95)<500"], // SLA: p(95) < 500ms
        http_req_failed: ["rate<0.01"], // Extra Guardrail: Keep HTTP error rate under 1%
    },
};

// Target Server URL (Defaults to port 5001 or process environment)
const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";

export default function () {
    // Execute GET request to the shop product-list route
    const res = http.get(`${BASE_URL}/product-list`);

    // Verify response HTTP status and content
    check(res, {
        "Status is 200": (r) => r.status === 200,
    });

    // Pause briefly between user iterations to simulate real user pacing
    sleep(1);
}
