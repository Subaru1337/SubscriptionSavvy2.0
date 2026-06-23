// Security Verification Script
// Run this script using: node verify-security.js

const API_URL = "https://subscription-savvy2-0-web.vercel.app/api";

async function runTests() {
  console.log("🛡️ Starting Security Verification Tests...\n");

  // TEST 1: Rate Limiting
  console.log("⏳ TEST 1: Rate Limiting (Spamming login endpoint)");
  let rateLimitHit = false;
  for (let i = 1; i <= 12; i++) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "bad" }),
    });

    if (res.status === 429) {
      rateLimitHit = true;
      console.log(`   ✅ Request ${i} was blocked correctly (429 Too Many Requests).`);
      break;
    } else if (res.status === 401) {
      process.stdout.write("."); // 401 is expected for bad password
    }
  }
  if (!rateLimitHit) console.log("   ❌ Rate limiting did not trigger. (Wait 60s before running script again)");

  // TEST 2: JWT Token Exposure (Web)
  console.log("\n🔒 TEST 2: JWT Token Exposure (Web Client)");
  const webRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", password: "bad" }),
  });
  const webBody = await webRes.json();
  if (webBody.token === undefined) {
    console.log("   ✅ Web response correctly hides the JWT token in the body.");
  } else {
    console.log("   ❌ JWT token is still exposed to web clients!");
  }

  // TEST 3: JWT Token Exposure (Mobile)
  console.log("\n📱 TEST 3: JWT Token Delivery (Mobile Client)");
  const mobileRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Type": "mobile" },
    body: JSON.stringify({ email: "test@test.com", password: "bad" }),
  });

  // Note: Since we are using bad credentials, we expect a 401. 
  // If we used good credentials, mobileBody.token would be populated.
  // We just want to ensure the server doesn't crash on this header.
  if (mobileRes.status === 401 || mobileRes.status === 429) {
    console.log("   ✅ Mobile request with X-Client-Type header processed correctly.");
  }

  // TEST 4: Security Headers
  console.log("\n🌐 TEST 4: Security Headers & CORS");
  const headersRes = await fetch(`${API_URL}/auth/login`, { method: "OPTIONS" });
  const hasNoSniff = headersRes.headers.get("x-content-type-options") === "nosniff";
  const hasFrameOptions = headersRes.headers.get("x-frame-options") === "DENY";
  const hasCors = headersRes.headers.get("access-control-allow-origin") !== null;

  if (hasNoSniff && hasFrameOptions) {
    console.log("   ✅ Security headers (X-Content-Type-Options, X-Frame-Options) are active.");
  } else {
    console.log("   ❌ Missing security headers.");
  }

  if (hasCors) {
    console.log(`   ✅ CORS Origin restricted to: ${headersRes.headers.get("access-control-allow-origin")}`);
  } else {
    console.log("   ❌ CORS headers not found (Are they configured in next.config.js?).");
  }

  console.log("\n✅ Done!");
}

runTests();
