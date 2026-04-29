
console.log("SERVER STARTED");



const express = require("express");
const fetch = require("node-fetch"); // make sure installed


const app = express();
app.use(express.json());
app.use(express.static("public"));



// 1️⃣ testCases
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

// 2️⃣ runPipeline
function runPipeline(prompt) {
  const lower = prompt.toLowerCase();

  // failure handling
  if (!lower || lower.length < 5) {
    return { error: true };
  }

  // intent (same logic as your route)
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

  } 
  else if (lower.includes("social")) {
  intent = {
    features: ["posts", "likes", "profile"],
    entities: ["user", "post"]
  };
}

else if (lower.includes("hospital")) {
  intent = {
    features: ["patients", "appointments"],
    entities: ["patient", "doctor"]
  };
}

else if (lower.includes("blog")) {
  intent = {
    features: ["posts", "comments"],
    entities: ["user", "post"]
  };
}

else if (lower.includes("auth") || lower.includes("login")) {
  intent = {
    features: ["login", "roles"],
    entities: ["user"]
  };
}

  else {
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
    components: f === "cart"
      ? ["product_list", "total_price"]
      : f === "payment"
      ? ["payment_form"]
      : ["main"],
    layout: "default"
  }))
} ,

    api: {
  endpoints: intent.entities.map(e => ({
    path: `/${e}s`,
    method: e === "order" ? "POST" : "GET",
    input: e === "order" ? { productId: "string" } : {},
    output: { [e + "s"]: "array" }
  }))
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



  // VALIDATION
let errors = [];

// UI → API check
schema.ui.pages.forEach(page => {
  const nonDataPages = ["login", "dashboard", "home", "cart", "payment", "basic"];

  if (!nonDataPages.includes(page)) {
    const expectedEndpoint = `GET /${page}s`;

    if (!schema.api.endpoints.includes(expectedEndpoint)) {
      errors.push(`UI page without API: ${page}`);
    }
  }
});

// REPAIR
if (errors.length > 0) {
  errors.forEach(err => {

    if (err.includes("UI page without API")) {
      const page = err.split(": ")[1];
      schema.api.endpoints.push(`GET /${page}s`);
    }

  });
}

  

  return {
    error: false,
    intent,
    schema,
    errors
  };
}

// 3️⃣ evaluateSystem
function evaluateSystem() {
  let results = [];

  testCases.forEach(prompt => {
    const result = runPipeline(prompt);

    let score = 0;

    // 1️⃣ No failure
    if (!result.error) {
      score += 1;
    }

    // 2️⃣ Meaningful intent
    if (
  result.intent &&
  result.intent.features.length > 0 &&
  !result.intent.features.includes("basic")
) {
  score += 1;
}

    // 3️⃣ Schema completeness
    if (
      result.schema &&
      result.schema.api &&
      result.schema.database &&
      result.schema.api.endpoints.length > 0 &&
      result.schema.database.tables.length > 0
    ) {
      score += 1;
    }

    // 4️⃣ No validation errors
    if (result.errors && result.errors.length === 0) {
      score += 1;
    }

    results.push({
      prompt,
      score,
      status: result.error
  ? "failed"
  : result.intent.features.includes("basic")
  ? "weak"
  : result.errors.length === 0
  ? "perfect"
  : "repaired"
    });
  });

  const total = results.length;
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / total;

  return {
    total,
    avgScore,
    results
  };
}


// 4️⃣ your main route
app.post("/generate", (req, res) => {
  const result = runPipeline(req.body.prompt);

  if (result.error) {
    return res.json({
      error: "Prompt too vague. Please describe the application."
    });
  }

  res.json({
    intent: result.intent,
    schema: result.schema,
    errors: result.errors,
    status: result.errors.length === 0 ? "valid" : "repaired"
  });
});



// 5️⃣ evaluation route
app.get("/evaluate", (req, res) => {
  const report = evaluateSystem();
  res.json(report);
});



// 6️⃣ server start
const PORT = process.env.PORT || 3000;

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

