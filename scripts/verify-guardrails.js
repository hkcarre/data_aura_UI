/**
 * Data Aura Guardrails & Evals Verification Engine
 * Runs security scenarios against data sharing policies.
 */

const GUARDRAIL_LIMITS = {
  MIN_COHORT_SIZE: 50,
  MAX_DP_EPSILON: 1.0,
};

const SCENARIOS = [
  {
    name: "Scenario 1: PII Leakage Prevention",
    description: "Scan data sharing payload for raw identifiers (emails, phone numbers).",
    payload: {
      cohort_id: "active_runners",
      user_email: "helen@example.com", // Raw PII
      purchases_count: 5,
    },
    run: (data) => {
      const piiRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      if (piiRegex.test(JSON.stringify(data))) {
        return {
          status: "BLOCKED",
          reason: "Raw email pattern matched in data payload. Raw PII is prohibited.",
          passed: true // The guardrail successfully blocked the threat
        };
      }
      return { status: "PASSED", reason: "No raw PII patterns detected.", passed: false };
    }
  },
  {
    name: "Scenario 2: Cohort Size Minification",
    description: "Verify that lookalike audiences satisfy minimum size requirements to avoid re-identification.",
    payload: {
      cohort_name: "high_spend_luxury",
      size: 12, // Too small
    },
    run: (data) => {
      if (data.size < GUARDRAIL_LIMITS.MIN_COHORT_SIZE) {
        return {
          status: "BLOCKED",
          reason: `Cohort size (${data.size}) is below safety threshold of ${GUARDRAIL_LIMITS.MIN_COHORT_SIZE} users.`,
          passed: true // Guardrail successfully blocked
        };
      }
      return { status: "PASSED", reason: "Cohort size is within safety parameters.", passed: false };
    }
  },
  {
    name: "Scenario 3: Revoked Consent Token Gate",
    description: "Verify that requests are blocked if user consent toggles are disabled.",
    payload: {
      brand: "Nike Inc.",
      consent_active: false,
      token: "tkn_nike_991"
    },
    run: (data) => {
      if (!data.consent_active) {
        return {
          status: "REJECTED",
          reason: `Consent has been revoked for ${data.brand}. Permission token invalidated.`,
          passed: true
        };
      }
      return { status: "AUTHORIZED", reason: "Consent is active.", passed: false };
    }
  },
  {
    name: "Scenario 4: Differential Privacy Noise Verification",
    description: "Check if differential privacy epsilon is configured safely.",
    payload: {
      epsilon: 0.1,
      base_avg_purchase: 120.0
    },
    run: (data) => {
      if (data.epsilon > GUARDRAIL_LIMITS.MAX_DP_EPSILON) {
        return {
          status: "REJECTED",
          reason: `Epsilon (${data.epsilon}) exceeds maximum privacy threshold of ${GUARDRAIL_LIMITS.MAX_DP_EPSILON}.`,
          passed: false
        };
      }
      // Simulate Laplace Noise addition
      const noise = (Math.random() - 0.5) * (1 / data.epsilon) * 5;
      const anonymizedVal = data.base_avg_purchase + noise;
      return {
        status: "PASSED",
        reason: `Laplace noise applied successfully. True average $${data.base_avg_purchase.toFixed(2)} -> Anonymised $${anonymizedVal.toFixed(2)} (epsilon=${data.epsilon})`,
        passed: true
      };
    }
  },
  {
    name: "Scenario 5: Compliant Clean Room Transaction",
    description: "Test query containing only hashed identities, large cohort size, active consent, and safe epsilon.",
    payload: {
      brand: "Starbucks Coffee",
      consent_active: true,
      hashed_emails: ["0x3a2c...", "0x89ef...", "0xfc12..."],
      cohort_size: 150,
      epsilon: 0.2
    },
    run: (data) => {
      if (data.consent_active && data.cohort_size >= GUARDRAIL_LIMITS.MIN_COHORT_SIZE && data.epsilon <= GUARDRAIL_LIMITS.MAX_DP_EPSILON) {
        return {
          status: "PASSED",
          reason: `Clean room execution authorized. ${data.cohort_size} hashed identities synced under epsilon=${data.epsilon}.`,
          passed: true
        };
      }
      return { status: "REJECTED", reason: "Compliance requirements not met.", passed: false };
    }
  }
];

console.log("==========================================================");
console.log("     DATA AURA GUARDRAILS & EVALUATION TEST SUITE       ");
console.log("==========================================================");
console.log(`Min Cohort Size Threshold: ${GUARDRAIL_LIMITS.MIN_COHORT_SIZE}`);
console.log(`Max DP Epsilon Limit: ${GUARDRAIL_LIMITS.MAX_DP_EPSILON}`);
console.log("----------------------------------------------------------\n");

let passedCount = 0;

SCENARIOS.forEach((scenario, idx) => {
  console.log(`[Eval ${idx + 1}] ${scenario.name}`);
  console.log(`Description: ${scenario.description}`);
  
  const result = scenario.run(scenario.payload);
  
  if (result.passed) {
    passedCount++;
    console.log(`Outcome: \x1b[32mPASS\x1b[0m (Result: ${result.status})`);
    console.log(`Audit Log: ${result.reason}`);
  } else {
    console.log(`Outcome: \x1b[31mFAIL\x1b[0m (Result: ${result.status})`);
    console.log(`Audit Log: ${result.reason}`);
  }
  console.log("----------------------------------------------------------\n");
});

console.log("==========================================================");
console.log(`EVALUATION COMPLETE: ${passedCount} / ${SCENARIOS.length} Guardrails Passed`);
console.log("==========================================================");

if (passedCount === SCENARIOS.length) {
  process.exit(0);
} else {
  process.exit(1);
}
