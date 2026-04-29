console.log("SERVER STARTED");

const express = require("express");
const path = require("path");
const fetch = require("node-fetch"); // make sure installed

const PUBLIC_DIR = path.join(process.cwd(), "public");

const app = express();
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// 1. testCases
const testCases = [
  "Build a CRM with login and dashboard",
  "Build a CRM with dashboard",
  "Create an ecommerce app with cart and payment",
  "Build a social media app with posts and likes",
  "Build a hospital system with patients and doctors",
  "hi",
  "app",
  "make something",
  "system with users",
  "platform with authentication"
];

// 2. runPipeline
function runPipeline(prompt) {
  const lower = prompt.toLowerCase();

  // failure handling
  if (!lower || lower.length < 5) {
    return { error: true };
  }

  // intent
  let intent;

  if (lower.includes("crm")) {
    intent = {
      features: ["login", "dashboard"],
      entities: ["user", "customer"]
    };
  } else if (lower.includes("ecommerce")) {
    intent = {
      features: ["cart", "payment"],
      entities: ["product", "order"]
    };
  } else if (lower.includes("social")) {
    intent = {
      features: ["posts", "likes", "profile"],
      entities: ["user", "post"]
    };
  } else if (lower.includes("hospital")) {
    intent = {
      features: ["patients", "appointments"],
      entities: ["patient", "doctor"]
    };
  } else if (lower.includes("blog")) {
    intent = {
      features: ["posts", "comments"],
      entities: ["user", "post"]
    };
  } else if (lower.includes("auth") || lower.includes("login")) {
    intent = {
      features: ["login", "roles"],
      entities: ["user"]
    };
  } else {
    intent = {
      features: ["basic"],
      entities: ["user"]
    };
  }

  // schema
  let schema = {
    auth: {
      roles: ["admin", "user"],
      permissions: {
        admin: ["create", "read", "update", "delete"],
        user: ["read"]
      }
    },

    ui: {
      pages: intent.features.map(f => ({
        name: f,
        components:
          f === "cart"
            ? ["product_list", "total_price"]
            : f === "payment"
            ? ["payment_form"]
            : ["main"],
        layout: "default"
      }))
    },

    api: {
      endpoints: intent.entities.map(e => `GET /${e}s`)
    },

    business_logic: {
      payment_required_for_order: true,
      cart_required_before_payment: true
    },

    database: {
      tables: intent.entities.map(e => ({
        name: `${e}s`,
        fields:
          e === "product"
            ? { id: "string", name: "string", price: "number" }
            : { id: "string", productId: "string" },
        relations: e === "order" ? ["products"] : []
      }))
    }
  };

  // validation
  let errors = [];

  schema.ui.pages.forEach(pageObj => {
    const page = pageObj.name;
    const nonDataPages = ["login", "dashboard", "home", "cart", "payment", "basic"];

    if (!nonDataPages.includes(page)) {
      const expectedEndpoint = `GET /${page}s`;

      if (!schema.api.endpoints.includes(expectedEndpoint)) {
        errors.push(`UI page without API: ${page}`);
      }
    }
  });

  // repair
  let retries = 0;

  if (errors.length > 0) {
    errors.forEach(err => {
      if (err.includes("UI page without API")) {
        const page = err.split(": ")[1];
        schema.api.endpoints.push(`GET /${page}s`);
        retries++;
      }
    });
  }

  return {
    error: false,
    intent,
    schema,
    errors,
    retries
  };
}

// 3. measurePipeline
function measurePipeline(prompt) {
  const startedAt = Date.now();
  const result = runPipeline(prompt);
  const latency = Date.now() - startedAt;

  return {
    result,
    latency,
    retries: result.retries || 0
  };
}

// 4. evaluateSystem
function evaluateSystem() {
  let results = [];
  let totalLatency = 0;
  let totalRetries = 0;

  const statusDistribution = {
    perfect: 0,
    repaired: 0,
    weak: 0,
    failed: 0
  };

  const failureBreakdown = {
    vague_prompt: 0,
    weak_intent: 0,
    repaired_schema: 0,
    low_score: 0
  };

  testCases.forEach(prompt => {
    const measured = measurePipeline(prompt);
    const result = measured.result;

    totalLatency += measured.latency;
    totalRetries += measured.retries;

    let score = 0;

    if (!result.error) {
      score += 1;
    }

    if (
      result.intent &&
      result.intent.features.length > 0 &&
      !result.intent.features.includes("basic")
    ) {
      score += 1;
    }

    if (
      result.schema &&
      result.schema.api &&
      result.schema.database &&
      result.schema.api.endpoints.length > 0 &&
      result.schema.database.tables.length > 0
    ) {
      score += 1;
    }

    if (result.errors && result.errors.length === 0) {
      score += 1;
    }

    const status = result.error
      ? "failed"
      : result.intent.features.includes("basic")
      ? "weak"
      : result.retries > 0
      ? "repaired"
      : "perfect";

    statusDistribution[status]++;

    if (status === "failed") {
      failureBreakdown.vague_prompt++;
    }

    if (status === "weak") {
      failureBreakdown.weak_intent++;
    }

    if (status === "repaired") {
      failureBreakdown.repaired_schema++;
    }

    if (score < 4) {
      failureBreakdown.low_score++;
    }

    results.push({
      prompt,
      score,
      status,
      latency: measured.latency,
      retries: measured.retries
    });
  });

  const total = results.length;

  const successful = results.filter(r => r.status !== "failed").length;

  const avgScore =
    total > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / total
      : 0;

  const successRate =
    total > 0
      ? Math.round((successful / total) * 100)
      : 0;

  const avgLatency =
    total > 0
      ? Math.round(totalLatency / total)
      : 0;

  const avgRetries =
    total > 0
      ? Number((totalRetries / total).toFixed(2))
      : 0;

  return {
    total,
    avgScore,
    successRate,
    avgLatency,
    avgRetries,
    failureBreakdown,
    statusDistribution,
    results
  };
}

// 5. generate route
app.post("/generate", (req, res) => {
  const startedAt = Date.now();
  const result = runPipeline(req.body.prompt);
  const latency = Date.now() - startedAt;

  if (result.error) {
    return res.json({
      error: "Prompt too vague. Please describe the application.",
      latency,
      retries: 0,
      status: "failed"
    });
  }

  res.json({
    intent: result.intent,
    schema: result.schema,
    errors: result.errors,
    latency,
    retries: result.retries || 0,
    status: result.retries > 0 ? "repaired" : "valid"
  });
});

// 6. evaluation route
app.get("/evaluate", (req, res) => {
  const report = evaluateSystem();
  res.json(report);
});

// 7. server start
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
