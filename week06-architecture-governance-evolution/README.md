# Week 06: Architecture Reasoning, Governance & System Evolution

> **Key Concept**: Engineers *build* systems. Architects *decide how systems are allowed to change*.
> Week 06 teaches you to ask the hard questions: Where do things belong? What's non-negotiable? How do you evolve safely?

## Learning Objectives

By the end of this week, you will understand:

1. **Boundaries as Design Decisions** — Not just technical divisions, but answers to "Who? What? Why not?"
2. **Trade-offs as Anchors** — How to document and justify fundamental choices so they don't get rewritten by accident
3. **Governance as Structure** — Encoding policy directly into system design, not hoping teams follow rules
4. **Evolution Without Outages** — How to add features, change internals, and maintain trust simultaneously
5. **Architecture Reasoning** — The communication skill that separates mid-level from senior engineers

## The Problem We're Solving

**Week 05 Reality**: You built a working system!

```
┌─ Client ──────────────┐
│                       │
└─ HTTPS ───────────────┘
         ↓
┌─────────────────────────┐
│      EDGE BUS           │  ← Central, secure entry point
├─────────────────────────┤
│ (Auth, Policy, Audit)   │
└────────────┬────────────┘
             ↓ gRPC
┌─────────────────────────────┐
│      BACK-END BUS           │  ← Private, high-performance
├────────┬──────────┬──────────┤
│Upload  │Metadata  │Process   │
│Service │Service   │Service   │
└────────┴──────────┴──────────┘
```

**It works... until someone asks:**

- 🤔 "Why is authentication in the Edge Bus and not in each service?"
- 🤔 "If we add a new requirement next month, will we have to rewrite everything from scratch?"
- 🤔 "Can we add AI processing without breaking existing clients?"
- 🤔 "A compliance auditor is visiting. How do we explain our security model in business terms?"
- 🤔 "What happens during migration from today's system to the next generation?"

**Code alone doesn't answer these.**

That's where **architecture reasoning** comes in. It's the difference between "I built a system that works today" and "I designed a system that remains governable tomorrow."

---

## How Week 06 Builds on Previous Weeks

```
Week 01: Binary framing & protocol discipline
   ↓ "Messages have explicit structure and boundaries"
   
Week 02: Stateless vs stateful decision-making
   ↓ "Choose where memory lives, accept consequences"
   
Week 03: Microservices & async coordination
   ↓ "Decompose, but keep traces flowing"
   
Week 04: Zero-trust security & governance anchors
   ↓ "Guard the perimeter, audit everything"
   
Week 05: Edge Bus ↔ Back-End Bus architecture
   ↓ "Hide complexity behind consistent boundaries"
   
Week 06: Architecture reasoning & safe evolution
   ↓ "Make choices explicit, change without chaos"
```

Week 06 doesn't add new code or infrastructure. It teaches you to *think about* the systems you've built, and answer: **"How should this be allowed to change?"**

---

## Three Things Seniors Do That Juniors Don't

### Junior Thinking
```
"The requirements are X.
I need to build code to satisfy X.
I'll implement it."
```

### Senior Thinking
```
"The requirements are X.
But why X and not Y?
If requirements change, what breaks?
How do we change safely?
Let me design something that survives the change."
```

Week 06 teaches the Senior approach.

---

## Core Concepts: Architecture Reasoning Toolkit

### 1. Boundaries Are Decisions, Not Accidents

Every boundary answers three critical questions:

| Question | Example | Consequence |
|----------|---------|-------------|
| **Who can cross?** | "Only authenticated users" → Auth enforced at Edge | Unauthenticated requests never reach Back-End |
| **What can cross?** | "Only signed protobufs" → Protocol enforcement | Ad-hoc coupling becomes impossible |
| **What can't cross?** | "Never raw credentials" → Immediate credential expiry | Compromised tokens can't leak to internal services |

**Why this matters**: A boundary without rules is just a line. A boundary with rules is **governance**.

Example: Why is authentication at the Edge Bus, not in each service?

```
Option A: Each service authenticates
  ├─ Upload Service: verify JWT, query database
  ├─ Metadata Service: verify JWT, query database
  ├─ Processing Service: verify JWT, query database
  └─ Problem: 3× auth overhead, 3× chances for inconsistency

Option B: Edge Bus authenticates once
  ├─ Edge Bus: verify JWT once
  ├─ Backend services: trust Edge has done the work
  └─ Problem: If Edge is compromised, everything fails

Decision: Option B. Why?
  → Single audit point (easier to debug)
  → Consistent auth (no service-specific bugs)
  → Centralized policy (change once, applies everywhere)
  → Trade-off accepted: Edge failure = system failure
     (mitigated by deployment redundancy)
```

**This is the reasoning architecture demands.**

### 2. Trade-offs as Documented Anchors

Never make a choice without writing it down. Here's the template:

```markdown
## Trade-off: Edge vs Back-End Authentication

### Options
1. **Edge-Only**: Single auth point (current choice)
2. **Per-Service**: Each service verifies independently
3. **Hybrid**: Some services verify, some trust Edge

### Choice: Edge-Only

### Reasoning
- Single audit point simplifies compliance
- Consistent policy across all services
- Easier to integrate new auth methods (OAuth 2.1 → OIDC)

### Trade-offs Accepted
| Dimension | Cost |
|-----------|------|
| Latency | +0ms (Edge handles it anyway) |
| Reliability | Edge becomes bottleneck; mitigated by clustering |
| Debugging | Any auth failure goes to Edge logs (centralized) |
| Flexibility | Services can't do custom auth (intentional) |

### If Requirements Change
If we later need per-service auth:
  1. Add local verification to services
  2. Edge still verifies (defense in depth)
  3. Cost: double the CPU used for auth
  4. Benefit: service isolation
```

**Key insight**: Write this down. Six months later, someone will ask "Why are we doing it this way?" and you'll know exactly why, instead of saying "idk, it was like that."

### 3. Governance as Encoded Structure

Governance isn't a PDF document. It's **system structure that makes wrong things impossible**.

Example: PII Protection (Week 04 concept, Week 06 enforcement)

**Bad approach**:
```
"All services must not log PII."
[PDF policy document]
→ Hope developers remember
→ Will be violated under pressure
```

**Good approach** (Week 06):
```python
class PII:
    """Marker type: this data must never be logged."""
    __slots__ = ('value',)
    
    def __repr__(self):
        """Never reveal PII in logs."""
        return "<PII:hidden>"
    
    def __str__(self):
        """Never reveal PII in logs."""
        return "<PII:hidden>"

# In metadata service
user_email: PII = PII(email_value)
logger.info(f"User: {user_email}")  
# Output: "User: <PII:hidden>" (impossible to leak)

# Trying to serialize to JSON will fail
json.dumps({"email": user_email})  # TypeError: PII not JSON serializable
# → Developer gets immediate feedback: "This can't be logged"
```

**This is governance encoded into the type system.**

It makes the *right* thing (not logging PII) easy, and the *wrong* thing (logging PII) hard or impossible.

### 4. Evolution Patterns: How to Change Without Downtime

**Week 05 system**: Version 1, built for today's traffic (1,000 req/sec).

**Week 07 requirement**: Add AI integration, expect 10× traffic.

**Challenge**: Can't take downtime. Can't break clients.

**Week 06 solution**: Apply evolution patterns.

#### Pattern 1: Strangler Fig (Incremental Replacement)

Idea: Build the new system *beside* the old, gradually move traffic.

```
Today (Week 05):
Client → Edge Bus → Upload Service (v1)

Week 06 (build new):
Client → Edge Bus → Routing Logic
              ├─→ Upload Service (v1, 90% traffic)
              └─→ Upload Service (v2, 10% traffic, shadow)

Later (Week 07):
Client → Edge Bus → Upload Service (v2, 100%)
Upload Service (v1) is shut down
```

**Key**: Old system is still running and serving real traffic. New system is tested with real-world conditions *before* full switchover.

#### Pattern 2: Feature Flags (Reversible Changes)

```python
@app.post("/files")
async def upload_file(file: UploadFile):
    user_id = extract_user_id()
    
    # New feature: AI analysis (guarded by flag)
    if feature_flag("ai_analysis_enabled", user_id, percent=10):
        # 10% of users get new behavior
        result = await new_ai_service.analyze(file)
    else:
        # 90% of users get old behavior
        result = await old_service.process(file)
    
    return result
```

**Power**: If new behavior has a bug, flip the flag off. No deployment needed.

#### Pattern 3: Dual-Write / Dual-Read (Database Migrations)

Old database schema: `users(id, name, email)`
New requirement: Add PII encryption

```python
# Phase 1: Dual-Write (Week 1-2)
async def create_user(name, email):
    # Write to old table (unencrypted, for compatibility)
    await old_db.execute(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        (name, email)
    )
    
    # Write to new table (encrypted)
    encrypted_email = encrypt(email)
    await new_db.execute(
        "INSERT INTO users_encrypted (name, email_encrypted) VALUES (?, ?)",
        (name, encrypted_email)
    )

# Phase 2: Dual-Read (Week 3-4)
async def get_user(user_id):
    try:
        # Try new table first (more reliable)
        return await new_db.query("SELECT * FROM users_encrypted WHERE id = ?", user_id)
    except:
        # Fall back to old table (backward compat)
        return await old_db.query("SELECT * FROM users WHERE id = ?", user_id)

# Phase 3: Full Cutover (Week 5)
# Stop writing to old table, read only from new
# After few weeks, delete old table
```

**Power**: Zero downtime migration. Can rollback anytime.

---

## Project Structure

This week is **design-focused, not code-heavy**.

```
week06-architecture-governance-evolution/
├── decisions/
│   ├── ADR-001-edge-bus-auth.md          # Why auth is centralized
│   ├── ADR-002-async-vs-sync.md          # When to use events vs RPC
│   ├── ADR-003-pii-encoding.md           # How PII becomes un-loggable
│   └── ADR-004-evolution-strategy.md     # Path from v1 → v2 → v3
│
├── diagrams/
│   ├── architecture-v1.mmd               # Week 05 system
│   ├── boundaries-decision.mmd           # Who/what/why for each boundary
│   ├── governance-zones.mmd              # Where policy is enforced
│   └── evolution-timeline.mmd            # v1 vs v2 migration timeline
│
├── trade-offs/
│   ├── latency-vs-consistency.md         # REST vs gRPC trade-off
│   ├── synchronous-vs-asynchronous.md    # RPC vs Events trade-off
│   └── centralized-vs-decentralized.md   # Where does logic belong?
│
└── README.md                              # This file
```

**Deliverable Focus**: Architecture diagrams, decision records, and trade-off matrices.
**Rubric Focus**: Clear thinking, not lines of code.

---

## Lab: Architecture Reasoning Studio

### Scenario 1: Add AI Processing

**Constraint**: Clients are not aware AI exists.

**The Decision**:
- Where does AI analysis live? (Edge? Back-End Service? Event handler?)
- Is it synchronous (block upload until AI finishes) or async (AI works in background)?
- Who enforces PII protection?

**Your Task**:
1. **Redraw the architecture** to show where the AI service fits
2. **Write 3 trade-off matrices**: latency vs cost, sync vs async, inline vs async
3. **Write 1 ADR**: "Where Should AI Processing Live?"
4. **Explain how a human can prevent bad AI decisions** (governance)

Example structure:

```markdown
## ADR-005: AI Processing Location & Async Model

### Context
Client uploads file. System must analyze with AI.
Current system: synchronous upload with immediate response.
AI analysis takes 30 seconds.

### Options
1. **Synchronous**: Block upload until AI completes (slow but simple)
2. **Async + Event**: Return immediately, AI runs in background (fast, complex)
3. **Async + On-Demand**: Return immediately, user polls for result (complex, flexible)

### Decision
**Option 2: Async + Event Bus**

### Reasoning
- Users get fast response (UX wins)
- AI runs independently (failure isolation)
- Can retry/replay if AI service crashes
- Can scale AI independently from uploads

### Trade-offs
| Dimension | Cost |
|-----------|------|
| Latency | ↓ User sees response in 100ms instead of 30s |
| Complexity | ↑ Need event bus, async handling, state tracking |
| Cost | ↓ AI only runs once, not on every retry |
| Debugging | ↑ Need trace IDs across async boundaries |

### Governance: PII in AI
- AI service receives `File` object
- `File.path` is safe (internal path, not PII)
- `File.content` might be PII
- Rule: AI service *never* logs `File.content`, only metadata
- Enforcement: Type system + code review (not PDF policy)
```

### Scenario 2: Migrate to Microservices v2

**Constraint**: Zero downtime. Can't tell clients about migration.

**The Decision**:
- How do you run v1 and v2 simultaneously?
- When do you flip traffic?
- How do you rollback instantly?

**Your Task**:
1. **Draw timeline**: Week 1 (setup), Week 2 (canary), Week 3 (migration), Week 4 (cleanup)
2. **Write 2 ADRs**: "Feature Flag Strategy" and "Traffic Routing"
3. **Explain kill switches**: What breaks if v2 is broken? (How operator kills it)

### Scenario 3: Compliance Audit is Coming

**Constraint**: Auditor asks "Show me your security architecture. Where is authorization checked? Where is audit logged? Can a human override a decision?"

**Your Task**:
1. **Draw zones**: Public, perimeter, private, admin corridor
2. **Mark enforcement points**: Where is auth? Where is audit? Where can humans intervene?
3. **Write 1 ADR**: "Participative Computing: How Humans Intervene in Policy"

---

## Thinking Like an Architect: Two Examples

### Example 1: Why Is Audit Logging Immutable?

**Naive approach**:
```python
audit_log = []  # Python list
audit_log.append({"action": "file.uploaded", "user": "alice"})
# Later: someone realizes log has a bug
audit_log.pop()  # Removed! But auditor saw it...
```

**Architecture approach**:
```
Audit logging goes to:
  1. Immutable append-only log (can't be deleted)
  2. WORM storage (Write-Once-Read-Multiple)
  3. Separate from application (different system)

Consequence:
  → Once logged, can't be unlogged (forensic requirement)
  → Even system admin can't delete logs
  → If bug found, *new* log entry explains it (doesn't erase)
```

This is **governance through immutability**, not rules on paper.

### Example 2: Why Two Buses?

**Question**: Why not just one bus? Why separate Edge and Back-End?

**Naive answer**: "gRPC is faster."

**Architect answer**:
```
Edge Bus responsibility:
  • Friendly to clients
  • Enforce policy uniformly
  • Central logging point
  • Can be stateless

Back-End Bus responsibility:
  • Optimized for internal efficiency
  • Can be stateful
  • Internal topology hidden
  • Can change independently

If we combined them:
  → Edge must be as fast as Back-End (expensive)
  → Internal topology visible to clients (security risk)
  → Can't upgrade internal protocols without affecting clients
  → Every service must implement client-friendly auth

By separating:
  → Each bus optimized for its job
  → Policy enforced once at boundary
  → Internal topology can change freely
  → Low-latency internal protocols possible
```

This is **trade-off reasoning fully articulated**.

---

## Common Questions

**Q: Isn't writing all this documentation extra work?**  
A: Yes. But less work than discovering six months in that your architecture can't evolve. Senior engineers spend 30% more time on design, 30% less time on rework.

**Q: Do we write ADRs for *every* decision?**  
A: No. Write them for decisions that:
  - Are hard to reverse
  - Affect multiple teams
  - Have non-obvious trade-offs
  - Will surprise someone later

**Q: What if we get the architecture decision wrong?**  
A: That's OK. The point is: you *know* why you chose it, and can re-examine if requirements change. Without reasoning, wrong decisions hide.

**Q: This is very theoretical. Is it real?**  
A: Yes. This is how systems scale from 1K to 1M users. At scale, architecture wins matter more than code quality.

**Q: How do I explain this to my manager?**  
A: "I'm doing architecture review instead of coding this week. I'm documenting why we built things the way we did, and making a plan for how to evolve. This prevents us from doing a complete rewrite when requirements change."

---

## Building Intuition: The City Analogy (Extended)

### Version 1: Unplanned City
```
Things happen as needed.
Someone wants a bakery → build bakery anywhere.
City needs power → add power lines anywhere.
Traffic grows → add roads where pressure exists.
Result: Chaotic, can't evolve, fragile.
```

### Version 2: City with Zoning
```
Residential zones.
Commercial zones.
Industrial zones.
Transit corridors.
Power grid designed first.
Result: Organized, but rigid. Hard to change zones.
```

### Version 3: City with Zoning + Governance
```
Zones established (boundaries).
Zoning rules written (who can cross what).
Planning board (humans make override decisions).
Building codes (make certain mistakes impossible).
Utilities planned for 10× growth (evolution pattern).
Result: Organized, governable, evolvable.
```

**Your Week 05 system is Version 2** (Edge/Back-End).  
**Week 06 teaches Version 3** (Reasoning + Governance).

---

## Next Steps

1. **Pick a scenario** (AI, migration, compliance)
2. **Redraw the architecture** with your changes
3. **Write 3–5 ADRs** explaining decisions
4. **Document boundaries** (who/what/why)
5. **Create evolution plan** (how to get there without breaking things)
6. **Present to class** — explaining your choices

---

**Key Takeaway**: The difference between mid-level and senior engineers isn't code quality. It's the ability to think about *systems*, *boundaries*, *trade-offs*, and *evolution*.

That is the work of Week 06.
