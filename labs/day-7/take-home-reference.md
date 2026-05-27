# Session 7 — Take-Home Reference Sheet
# Beyond UI: Rest Assured, Performance & Security

> All code samples in this sheet can be used as a self-study reference to run and experiment with each tool independently after the course.

---

## Contents

1. [Rest Assured — Basic Syntax](#1-rest-assured--basic-syntax)
2. [RequestSpecification and ResponseSpecification](#2-requestspecification-and-responsespecification)
3. [Schema Validation and API Chaining](#3-schema-validation-and-api-chaining)
4. [NFR Concepts — Quick Reference](#4-nfr-concepts--quick-reference)
5. [Gatling — Load Test Structure](#5-gatling--load-test-structure)
6. [Karate — Dual-Use API and Performance Testing](#6-karate--dual-use-api-and-performance-testing)
7. [OWASP Top 10 — Tester Reference](#7-owasp-top-10--tester-reference)
8. [API Security Testing Checklist](#8-api-security-testing-checklist)
9. [CI/CD Security Scanning Pipeline](#9-cicd-security-scanning-pipeline)
10. [The Unified Automation Stack](#10-the-unified-automation-stack)
11. [Setup Guides](#11-setup-guides)

---

## 1. Rest Assured — Basic Syntax

Rest Assured is a Java DSL for testing REST APIs. It uses a fluent Given/When/Then pattern that mirrors BDD readability.

**Maven dependency (`pom.xml`):**
```xml
<dependency>
  <groupId>io.rest-assured</groupId>
  <artifactId>rest-assured</artifactId>
  <version>5.4.0</version>
  <scope>test</scope>
</dependency>
```

**Basic GET with assertions:**
```java
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

given()
  .baseUri("https://api.myapp.com")
  .header("Authorization", "Bearer " + token)
.when()
  .get("/products/123")
.then()
  .statusCode(200)
  .body("name", equalTo("Widget"))
  .body("price", greaterThan(0.0f));
```

**POST with request body:**
```java
given()
  .baseUri("https://api.myapp.com")
  .header("Authorization", "Bearer " + token)
  .contentType(ContentType.JSON)
  .body("{ \"productId\": \"p-001\", \"quantity\": 2 }")
.when()
  .post("/orders")
.then()
  .statusCode(201)
  .body("id", notNullValue())
  .body("status", equalTo("pending"));
```

**Comparison: Rest Assured vs Playwright `request`:**

| Aspect | Rest Assured (Java) | Playwright `request` (TypeScript) |
|--------|---------------------|----------------------------------|
| Language | Java | TypeScript |
| Style | Fluent DSL | Async/await |
| Assertions | Hamcrest matchers | `expect()` |
| Schema validation | JSON Schema validator | `ajv` |
| Best for | Java API stacks | Node.js / browser + API stacks |

---

## 2. RequestSpecification and ResponseSpecification

Specifications let you define reusable request and response templates — eliminating repeated setup across many tests.

**Without specifications (every test repeats setup):**
```java
given()
  .baseUri("https://api.myapp.com")
  .header("Authorization", "Bearer " + token)
  .contentType(ContentType.JSON)
.when()
  .get("/products")
.then()
  .statusCode(200)
  .contentType(ContentType.JSON);
```

**With specifications (define once, use everywhere):**
```java
// Define in a base test class or @BeforeAll
RequestSpecification requestSpec = new RequestSpecBuilder()
  .setBaseUri("https://api.myapp.com")
  .addHeader("Authorization", "Bearer " + token)
  .setContentType(ContentType.JSON)
  .build();

ResponseSpecification responseSpec = new ResponseSpecBuilder()
  .expectStatusCode(200)
  .expectContentType(ContentType.JSON)
  .build();

// Every test body becomes clean and concise
given(requestSpec)
  .when().get("/products")
  .then().spec(responseSpec);

given(requestSpec)
  .when().get("/products/123")
  .then().spec(responseSpec).body("name", equalTo("Widget"));
```

**Rule:** Put `requestSpec` and `responseSpec` in a `BaseApiTest` class that all test classes extend. Tests should not repeat base URI or auth headers.

---

## 3. Schema Validation and API Chaining

### JSON Schema validation

Validates the shape, types, and required fields of a response — not just specific values.

```java
// Requires: rest-assured json-schema-validator dependency
given(requestSpec)
  .when().get("/products/123")
  .then()
    .statusCode(200)
    .body(matchesJsonSchemaInClasspath("schemas/product-schema.json"));
```

`schemas/product-schema.json` (in `src/test/resources/`):
```json
{
  "type": "object",
  "required": ["id", "name", "price", "category"],
  "properties": {
    "id":       { "type": "integer" },
    "name":     { "type": "string" },
    "price":    { "type": "number", "minimum": 0 },
    "category": { "type": "string" }
  },
  "additionalProperties": false
}
```

### API chaining — extract a value and use it in the next request

```java
// Step 1: create an order, extract the generated ID
String orderId =
  given(requestSpec)
    .body("{ \"productId\": \"p-001\", \"quantity\": 2 }")
  .when()
    .post("/orders")
  .then()
    .statusCode(201)
    .extract().path("id");

// Step 2: use the ID in the next call
given(requestSpec)
  .when().get("/orders/" + orderId)
  .then()
    .statusCode(200)
    .body("status", equalTo("pending"));
```

---

## 4. NFR Concepts — Quick Reference

Non-Functional Requirements define how a system performs, not what it does.

| Concept | Definition | Example Target |
|---------|-----------|----------------|
| **Response Time** | Time for one user's request to complete | p95 under 500ms |
| **Throughput** | Requests the system handles per second | 500 RPS |
| **Concurrency** | Number of simultaneous active users | 200 concurrent users |
| **Error Rate** | Percentage of requests that fail | under 0.1% |
| **Latency** | Network + server time, excluding client rendering | p99 under 1s |

### Types of performance tests

| Test Type | What It Asks | Traffic Shape |
|-----------|-------------|---------------|
| **Load test** | Does the system handle normal expected traffic? | Sustained at expected peak |
| **Stress test** | At what point does the system break? | Ramp beyond capacity |
| **Spike test** | Does the system recover after a sudden burst? | Sudden jump, then drop |
| **Soak test** | Do memory leaks or degradation appear over time? | Sustained for hours |

### Performance testing mindset

- Define NFR targets **before** writing the test — a test without a pass/fail threshold is just a benchmark
- Test the same endpoint your users actually hit — including any CDN, load balancer, or API gateway in the path
- p95 and p99 percentiles matter more than the mean — slow outliers hurt real users
- Establish a baseline on a clean environment; compare subsequent runs against that baseline, not against an arbitrary number

---

## 5. Gatling — Load Test Structure

Gatling is a Scala/Java load testing tool. It generates HTML reports showing throughput, response time percentiles, and error rates over time.

**Maven dependency:**
```xml
<dependency>
  <groupId>io.gatling.highcharts</groupId>
  <artifactId>gatling-charts-highcharts</artifactId>
  <version>3.10.5</version>
  <scope>test</scope>
</dependency>
```

**Simulation structure:**
```scala
import io.gatling.core.Predef._
import io.gatling.http.Predef._

class ProductApiSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.myapp.com")
    .header("Authorization", "Bearer mytoken")

  val searchScenario = scenario("Product Search")
    .exec(
      http("GET /products")
        .get("/products?query=widget")
        .check(status.is(200))
    )

  setUp(
    searchScenario.inject(
      rampUsers(100).during(30)        // ramp to 100 users over 30 seconds
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.percentile(95).lt(500),   // p95 under 500ms
     global.failedRequests.percent.lt(1)            // under 1% errors
   )
}
```

**Common injection profiles:**

```scala
// Ramp up: gradually increase from 0 to 100 users over 60 seconds
rampUsers(100).during(60)

// Steady state: hold 50 users per second for 2 minutes
constantUsersPerSec(50).during(120)

// Spike: jump to 500 users instantly
atOnceUsers(500)

// Ramp up, hold, ramp down (realistic load shape)
setUp(
  scenario.inject(
    rampUsers(100).during(30),           // ramp up
    constantUsersPerSec(100).during(120), // steady state
    rampUsers(0).during(30)              // ramp down (use nothingFor + stop)
  )
)
```

**Gatling HTML Report shows:**
- Active users over time
- Response time distribution (min, mean, p75, p95, p99, max)
- Requests per second
- Error breakdown by type

**Run:**
```bash
mvn gatling:test
# Report generated at: target/gatling/productsimulation-<timestamp>/index.html
```

---

## 6. Karate — Dual-Use API and Performance Testing

Karate is unique: the same Gherkin-style API test scenarios run as both functional tests and load tests without modification.

**Maven dependency:**
```xml
<dependency>
  <groupId>com.intuit.karate</groupId>
  <artifactId>karate-junit5</artifactId>
  <version>1.4.0</version>
  <scope>test</scope>
</dependency>
```

**API test (functional — `products.feature`):**
```gherkin
Feature: Product API

Scenario: Get product by ID
  Given url 'https://api.myapp.com/products/123'
  And header Authorization = 'Bearer ' + token
  When method GET
  Then status 200
  And match response.name == 'Widget'
  And match response.price == '#number'
```

**Run as a load test — no code changes to the feature file:**
```java
// ProductLoadTest.java
import com.intuit.karate.junit5.Karate;

class ProductLoadTest {
  @Karate.Test
  Karate testProductsUnderLoad() {
    return Karate.run("products")
      .relativeTo(getClass())
      .configure("threads", 10)
      .configure("iterations", 100);   // 10 threads x 100 iterations = 1000 total requests
  }
}
```

**When to choose Karate vs Gatling:**

| Criterion | Karate | Gatling |
|-----------|--------|---------|
| Reuse existing API tests as load tests | Yes | No — separate code |
| Advanced load profiles (ramp, spike, soak) | Basic | Full control |
| Report detail | Moderate | Excellent |
| Team language | Java / Kotlin | Scala / Java |
| Learning curve | Low (Gherkin) | Medium (Scala DSL) |

**Rule of thumb:** If you already have Karate functional tests, use Karate for initial load validation. Move to Gatling when you need precise ramp profiles or CI assertions on percentile thresholds.

---

## 7. OWASP Top 10 — Tester Reference

The OWASP Top 10 is the industry-standard reference for critical web application security risks.

| # | Vulnerability | What to Test |
|---|---------------|-------------|
| A01 | Broken Access Control | Can User A read or modify User B's data? Test with different auth tokens |
| A02 | Cryptographic Failures | Is sensitive data sent over plain HTTP? Are passwords stored in plain text? |
| A03 | Injection (SQL, NoSQL, OS) | Does the API sanitise malicious input strings in query params and request bodies? |
| A04 | Insecure Design | Are business logic flaws possible — negative quantities, price manipulation, skipping checkout steps? |
| A05 | Security Misconfiguration | Are default credentials active? Do error responses expose stack traces or internal paths? |
| A06 | Vulnerable Components | Are outdated libraries with known CVEs in the dependency tree? |
| A07 | Authentication Failures | Can brute-force attacks succeed? Are sessions invalidated on logout? |
| A08 | Software and Data Integrity Failures | Are CI/CD pipelines secured? Are dependencies verified before install? |
| A09 | Logging and Monitoring Failures | Are failed login attempts logged? Are alerts triggered on suspicious activity? |
| A10 | SSRF | Can the app be tricked into making requests to internal network addresses? |

---

## 8. API Security Testing Checklist

Use these checks as a starting point for any API under test.

### Authentication and authorisation
- [ ] Every protected endpoint returns `401` when called without a token
- [ ] A user with `viewer` role receives `403` when calling admin-only endpoints
- [ ] A token is invalidated after logout — it cannot be replayed on subsequent requests
- [ ] Tokens expire after the documented TTL

### Input validation
- [ ] The API rejects payloads with unexpected or extra fields (no mass-assignment)
- [ ] The API handles extremely large payloads gracefully — no crash, no timeout
- [ ] Malicious strings in query parameters and request bodies are sanitised

### Data exposure
- [ ] The API returns only the fields the caller is authorised to see
- [ ] Internal IDs, file paths, and stack traces are not exposed in error messages
- [ ] PII fields are not returned to callers who do not need them

### Rate limiting
- [ ] The API returns `429 Too Many Requests` after repeated rapid calls
- [ ] The rate limit is documented and consistent with the documented policy

**Testing these with Playwright `request`:**
```typescript
// A01: Broken access control — user A reads user B's order
test('viewer cannot access another user orders', async ({ request }) => {
  const viewerToken = await getToken(request, 'viewer@example.com');
  const adminOrder = await createAdminOrder(request);

  const res = await request.get(`/api/orders/${adminOrder.id}`, {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  expect(res.status()).toBe(403);
});

// A07: Session not invalidated after logout
test('token is invalid after logout', async ({ request }) => {
  const token = await getToken(request, 'standard_user@example.com');
  await request.post('/api/auth/logout', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const res = await request.get('/api/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.status()).toBe(401);
});
```

---

## 9. CI/CD Security Scanning Pipeline

### Tool categories

| Tool | Category | What It Scans |
|------|----------|---------------|
| OWASP ZAP | DAST | Running web app and API — active and passive scanning |
| Snyk | SCA + SAST | Dependency vulnerabilities + code issues |
| Trivy | SCA | Container images and filesystem |
| Semgrep | SAST | Source code static analysis |

**DAST (Dynamic Application Security Testing):** Tests a running application from the outside — like a real attacker would. Requires a deployed environment (staging).

**SAST (Static Application Security Testing):** Analyses source code without running it. Runs on PRs before deployment.

**SCA (Software Composition Analysis):** Scans dependency manifests (`package.json`, `pom.xml`) for known CVEs.

### Integrating OWASP ZAP into a GitHub Actions pipeline

```yaml
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: # your deploy step

      - name: Run ZAP API Scan
        uses: zaproxy/action-api-scan@v0.7.0
        with:
          target: 'https://staging.myapp.com/api/openapi.json'
          format: openapi
          fail_action: true
          cmd_options: '-a'
```

### Running npm dependency audit on every PR

```yaml
      - name: Audit dependencies
        run: npm audit --audit-level=high
```

### Pipeline security gates

- Block merge if new HIGH or CRITICAL vulnerabilities are introduced
- Run DAST on the staging environment after every deployment
- Run dependency scanning (`npm audit`, Snyk) on every PR
- Store scan reports as CI artefacts for audit trail

---

## 10. The Unified Automation Stack

Bring all layers together into a coherent strategy:

| Layer | Tool | When to Run |
|-------|------|------------|
| UI End-to-End | Playwright (TypeScript) | Critical user journeys, regression suite |
| API (Node.js stack) | Playwright `request` | API contract tests, hybrid flows |
| API (Java stack) | Rest Assured | Java backend API suites |
| BDD | Playwright + Cucumber | Scenarios requiring business sign-off |
| Visual | Playwright snapshots | UI-heavy releases, design system changes |
| Performance | Gatling / Karate | Pre-release load testing, NFR validation |
| Security | OWASP ZAP, Snyk, Trivy | Every PR (dependencies), every release (DAST) |

### Key principles

1. **Test at the right layer.** Not everything needs a UI test. An API test that runs in 50ms is always better than a UI test that does the same job in 5 seconds.
2. **API preconditioning makes UI tests faster and more reliable.** Set up state via API; test the UI interaction only.
3. **Mock backends for edge cases; use real backends for integration confidence.** `page.route()` for hard-to-reproduce errors, real API for happy-path flows.
4. **A CI pipeline without security scanning is incomplete.** Dependency scanning takes under a minute and catches known CVEs before they reach production.
5. **Automation is a product.** It needs maintenance, refactoring, and ownership. A test suite that is never updated is a liability, not an asset.

---

## 11. Setup Guides

### Rest Assured (Java + Maven)

1. Install Java 17+: `java -version`
2. Install Maven: `mvn -version`
3. Create a new Maven project or add the dependency to an existing `pom.xml` (see Section 1)
4. Add test class in `src/test/java/` with `import static io.restassured.RestAssured.*`

### Gatling (Maven plugin)

1. Add `gatling-maven-plugin` to `pom.xml`
2. Place simulation classes in `src/test/scala/`
3. Run: `mvn gatling:test`
4. Open the HTML report at `target/gatling/<simulation-name>-<timestamp>/index.html`

### Karate (JUnit 5)

1. Add `karate-junit5` dependency to `pom.xml` (see Section 6)
2. Place `.feature` files in `src/test/java/`
3. Create a JUnit 5 runner class (see Section 6)
4. Run: `mvn test`

### OWASP ZAP (local scan)

```bash
# Docker
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t https://localhost:3000/api/openapi.json \
  -f openapi

# Or install ZAP desktop from zaproxy.org for manual exploration
```

### Snyk (dependency scanning)

```bash
npm install -g snyk
snyk auth          # authenticate with your Snyk account
snyk test          # scan current project's dependencies
snyk monitor       # upload snapshot for ongoing monitoring
```

---

*Session 7 — Playwright Automation Bootcamp*
