# Week 07: AI-Native Architecture — Governed Autonomy & Anticipative Systems

> **Key Concept**: Traditional systems *execute instructions*. AI-native systems *make decisions*.
> Week 07 teaches you how to architect AI systems that can adapt, anticipate, and learn *while remaining under human control*.

## Learning Objectives

By the end of this week, you will understand:

1. **AI-Enabled vs AI-Native** — Why some systems use AI as a tool, and others let AI change their own behavior
2. **Autonomy Levels** — When to let AI decide alone, when to require human approval, when to do both
3. **Anchors & Budgets** — How to encode hard constraints and exploration limits into architecture
4. **Anticipative Patterns** — How systems detect weak signals and act before failure occurs
5. **Human-in-the-Loop Design** — How to position humans as active decision-makers, not observers
6. **Governing Adaptation** — How to let systems learn safely without losing trust

## The Problem We're Solving

**Week 06 Reality**: You can architect systems that evolve safely.

```
Your system now:
  ✓ Has clear boundaries
  ✓ Documents trade-offs
  ✓ Enables safe migrations
  ✓ Has governance rules
```

**New reality** (Week 07): You're adding AI.

```
Now your system:
  ? Makes predictions
  ? Changes behavior based on data
  ? Learns from past decisions
  ⚠️  But who decides when to trust it?
  ⚠️  What happens if it learns the wrong pattern?
  ⚠️  How does a human override a decision the AI made?
```

**Example**: Your file upload service now has ML anomaly detection.

```
Week 05 system:
  Client → Edge Bus → Upload Service → Storage
                      ↓ (just stores file)

Week 07 system:
  Client → Edge Bus → Upload Service
                      ├─ Checks: file size, type
                      ├─ ML model: "Is this suspicious?"
                      ├─ Decision: Auto-approve or escalate?
                      └─ Stores file
```

**Hard questions**:
- If the ML model says "suspicious," should the upload be rejected automatically, or escalated to a human first?
- If the model rejects 50% more uploads than last month, is it learning something real, or drifting?
- Can a human operator override the model's decision? How?
- If the model learns to reject uploads from a specific region, is that legitimate pattern detection or bias?

**Code solutions aren't enough.** You need **architecture** that makes the right governance possible.

---

## How Week 07 Builds on Previous Weeks

```
Week 01: Binary protocols & explicit boundaries
   ↓ "Messages have clear structure"

Week 02: Stateless vs stateful decision-making
   ↓ "You choose where memory lives"

Week 03: Microservices & async coordination
   ↓ "Services work independently, share events"

Week 04: Zero-trust security & audit
   ↓ "Every action must be verified & logged"

Week 05: Edge Bus ↔ Back-End Bus
   ↓ "Hide complexity behind safe boundaries"

Week 06: Architecture reasoning & evolution
   ↓ "Decide how systems change"

Week 07: AI-native architecture & governance
   ↓ "Decide how systems decide"
   = Extend everything above to include *intelligent* decisions
```

Week 07 **doesn't replace** weeks 01-06. It **extends** them.

An AI-native system is still:
- Well-bounded
- Secure
- Evolvable
- Governable

It's just that some decisions are now made by models, not hand-written logic.

---

## Two Systems You Need to Understand

### System 1: Traditional (Deterministic)

```python
@app.post("/files")
async def upload_file(file: UploadFile):
    # Human-written rules
    if file.size > 100_000_000:
        raise HTTPException(413, "File too large")
    
    if file.mimetype not in allowed_types:
        raise HTTPException(415, "Unsupported type")
    
    # If rules pass, store it
    file_id = await storage.save(file)
    return {"file_id": file_id}

# Decision logic is explicit
# Easy to understand, hard to adapt
```

**Behavior**: Same always (until code changes)

### System 2: AI-Native (Adaptive)

```python
@app.post("/files")
async def upload_file(file: UploadFile):
    # Human-written rules (anchors)
    if file.mimetype == "executable":
        raise HTTPException(415, "Executables forbidden")
    
    # AI decision (bounded by rules)
    risk_score = await anomaly_model.score(file)
    
    # What to do with score?
    if risk_score > 0.95:
        # High confidence anomaly: escalate to human
        case_id = await escalation_queue.add(file)
        return {"file_id": None, "status": "pending_review", "case_id": case_id}
    
    elif risk_score > 0.5:
        # Medium confidence: store but flag for async audit
        file_id = await storage.save(file)
        await audit_queue.add({"file_id": file_id, "risk": risk_score})
        return {"file_id": file_id, "status": "flagged"}
    
    else:
        # Low risk: accept normally
        file_id = await storage.save(file)
        return {"file_id": file_id, "status": "accepted"}
```

**Behavior**: Changes based on observations (learns and adapts)

**Key difference**: The first system has binary rules. The second has **graduated responses based on probability**.

---

## Core Concepts: AI-Native Architecture Patterns

### 1. The Three Decision Levels

Every decision involving AI must specify: **Who decides?**

| Level | Decision | Human Role | Example |
|-------|----------|-----------|---------|
| **0: Assist** | AI suggests; human decides | Active choice | "Here are 3 recommendations; you pick" |
| **1: Govern** | AI acts within strict rules; human audits | Spot-check & escalation | "Model can auto-approve if risk < 0.3; escalate above that" |
| **2: Adapt** | AI explores within budget; human supervises | Budget oversight | "Model can try new routes but can't increase cost by >10% overall" |
| **3: Autonomous** | AI fully decides; human only does post-incident review | Incident response | "AI routes traffic; we review crashes after they happen" |

**Critical rule**: You choose the level *per decision type*, not globally.

Example for file upload:
- Malware scan: Level 1 (auto-reject if confidence > 95%)
- Privacy check: Level 0 (always escalate to human)
- Spam filter: Level 2 (auto-classify, humans manage false positive rate)
- Compression selection: Level 3 (fully autonomous, no override needed)

### 2. Anchors: What AI Can Never Do

**Anchors are architectural constraints** that make certain decisions *impossible*, not just forbidden.

**Bad approach** (on paper):
```
"Models must never access raw PII"
[PDF policy document]
→ Hope developers remember
→ Will be violated under deadline pressure
```

**Good approach** (architectural):
```python
class PII:
    """Marker type: models can't access this."""
    value: str
    
    def __repr__(self):
        return "<PII:hidden>"

# In file service
metadata = {
    "filename": "document.pdf",  # OK for model
    "size": 1024,                # OK for model
    "uploader_email": PII(email) # Model can't see this!
}

# Model receives only safe fields
risk_score = await anomaly_model.score({
    "filename": metadata["filename"],
    "size": metadata["size"],
    # uploader_email is filtered out automatically
})
```

**Anchors** are usually:
- Legal constraints (e.g., "can't process EU user data without consent")
- Safety rules (e.g., "can't execute untrusted code")
- Ethical boundaries (e.g., "can't use race/gender for decisions about lending")

These are **encoded into types, not written as comments**.

### 3. Budgets: How Much Freedom Does AI Have?

Budgets limit AI exploration. Examples:

**Cost Budget**:
```python
# AI can retry failed uploads, but cumulatively costs < $0.01 per file
retry_budget = 0.01
retry_cost_so_far = 0.007
if retry_cost_so_far + next_retry_cost > retry_budget:
    escalate_to_human()  # Out of budget; human decides
```

**Exploration Budget**:
```python
# AI can try up to 3 different processing strategies
strategies_tried = 2  # Already tried 2
if strategies_tried < 3:
    try_next_strategy()  # Still have budget
else:
    escalate_to_human()  # Exhausted budget; human decides
```

**Error Tolerance Budget**:
```python
# AI can make mistakes, but not > 5% error rate
error_rate = 0.04  # Currently 4%
max_acceptable = 0.05
if error_rate + this_decision_error_prob > max_acceptable:
    escalate_to_human()  # Can't afford another mistake
```

**Why budgets?** They encode "we trust AI here, but not blindly."

### 4. Anticipative Systems: Act Before Failure

Anticipative systems don't react to problems. They *predict* them and act preemptively.

**Traditional reactive**:
```
Problem occurs
  ↓
Alert fires
  ↓
Human investigates
  ↓
Human fixes
  ↓
(Service was down during this time)
```

**Anticipative**:
```
Weak signals observed (ML)
  ↓
Pattern recognized (prediction model)
  ↓
Action taken automatically (auto-scale, reroute, etc.)
  ↓
Humans review *why* the action was taken (post-hoc)
  ↓
(Service stays up; no human-on-call needed)
```

Example: CPU prediction

```python
@event_bus.on("cpu_metrics")
async def maybe_scale_up(metrics):
    """Anticipate capacity problems before they happen."""
    
    # Get prediction
    predicted_cpu_in_5min = await ml_predictor.forecast(
        current_usage=metrics.cpu,
        trend=metrics.cpu_trend,
        load_pattern=metrics.current_hour,
        history=metrics.last_30days
    )
    
    # Check if we'll exceed capacity
    if predicted_cpu_in_5min > 0.85:  # 85% utilization
        await auto_scaler.add_instances(count=2)
        
        # Log the anticipative action
        await audit_log("anticipative_scale", {
            "current_cpu": metrics.cpu,
            "predicted_cpu": predicted_cpu_in_5min,
            "action": "added 2 instances",
            "reason": "predicted_overload"
        })
    
    # Also escalate if prediction confidence is low
    if predicted_cpu_in_5min > 0.85 and prediction_confidence < 0.6:
        await escalation_queue.add({
            "type": "uncertain_prediction",
            "details": prediction
        })
        # Human reviews: "Was this prediction correct?"
```

**Key benefit**: Acts *before* failure. Users never see the problem.

### 5. Human-in-the-Loop: Where Humans Re-Enter

AI-native doesn't mean "remove humans." It means "position humans correctly."

**Bad HITL design**:
```
AI makes decision
  ↓
Human sees result
  ↓ (Too late to change outcome)
Human logs complaint
```

**Good HITL design**:
```
Decision needs to be made
  ↓
Is it within AI's autonomy level?
  ├─ Yes (Level 3 autonomous)
  │  └─ AI decides now, human reviews later
  │
  └─ No (Level 0 or 1)
     ├─ AI provides recommendation + confidence
     ├─ Humans decide actively
     └─ Decision is recorded (for audit & learning)
```

**Implementation**:

```python
async def process_file(file: UploadFile):
    """Route file to appropriate decision process."""
    
    decision_type = "file_safety_check"
    autonomy_level = DECISION_LEVELS[decision_type]  # Level 1
    
    # AI provides recommendation
    risk_score = await safety_model.score(file)
    
    if autonomy_level == LEVEL_0_ASSIST:
        # Human always decides
        return {
            "status": "pending_human",
            "recommendations": await safety_model.explain(file),
            "awaiting_human_decision": True
        }
    
    elif autonomy_level == LEVEL_1_GOVERN:
        # AI can decide if confident
        if risk_score > 0.95:
            # Very confident in "reject" → reject automatically
            await audit_log("auto_rejected", {"risk": risk_score})
            raise HTTPException(403, "File rejected (security)")
        
        elif risk_score < 0.3:
            # Very confident in "accept" → accept automatically
            file_id = await storage.save(file)
            await audit_log("auto_accepted", {"risk": risk_score})
            return {"file_id": file_id}
        
        else:
            # Uncertain (0.3-0.95 confidence) → escalate to human
            case_id = await escalation_queue.add({
                "file": file,
                "risk": risk_score,
                "ai_recommendation": "UNCERTAIN"
            })
            return {
                "status": "pending_human",
                "case_id": case_id,
                "ai_confidence": risk_score,
                "ai_recommendation": "UNCERTAIN"
            }
    
    elif autonomy_level == LEVEL_3_AUTONOMOUS:
        # AI decides fully
        if risk_score > 0.5:
            await storage.reject_and_quarantine(file)
        else:
            file_id = await storage.save(file)
        
        # Log for post-incident review
        await audit_log("autonomous_decision", {"risk": risk_score})
        return {"file_id": file_id}
```

**Why this matters**: Humans can intervene in the gray zone (0.3-0.95 confidence), not just reactively afterward.

---

## Project Structure

This week combines design (like Week 06) with some code (showing how governance is embedded).

```
week07-ai-architecture/
├── decisions/
│   ├── ADR-001-autonomy-levels.md       # Why each decision gets its level
│   ├── ADR-002-anchors-and-budgets.md   # What AI can never do
│   ├── ADR-003-anticipation-strategy.md # What signals trigger action
│   └── ADR-004-human-governance.md      # How humans stay in control
│
├── diagrams/
│   ├── ai-decision-plane.mmd            # Where AI sits in the architecture
│   ├── autonomy-matrix.mmd              # Level per decision type
│   ├── escalation-flows.mmd             # When humans intervene
│   └── anticipation-loops.mmd           # AI predicts → acts → humans audit
│
├── examples/
│   ├── governance_types.py              # Anchor types (PII, Limits, etc.)
│   ├── autonomy_levels.py               # Decision routing by level
│   └── human_in_loop.py                 # Escalation patterns
│
└── README.md                             # This file
```

---

## Lab: Design an AI-Native Service

### Challenge 1: Content Moderation

**Scenario**: Your upload service now includes files that have *text content* (PDFs, docs). You need to filter harmful content.

**Your decisions**:
1. Where does the moderation model live? (Edge Bus? Back-End Service? Event pipeline?)
2. What autonomy level? (Can the model auto-reject, or must humans always decide?)
3. What are the anchors? (What can the model never do?)
4. What are the budgets? (How often can it be wrong? How much CPU budget?)
5. How do humans intervene? (When and how can they override the model?)

**Deliverables**:
1. **Decision diagram** — Show where moderation lives in the architecture
2. **Autonomy matrix** — Per content type (spam, hate speech, copyright, NSFW), specify the level
3. **Anchors document** — What can the model access? What's forbidden?
4. **Escalation flow** — When does human review happen?

Example structure:

```markdown
## ADR-001: Content Moderation Architecture

### Context
Text files uploaded can contain harmful content (hate speech, spam, copyright issues).
We need automated filtering but can't reject legitimate content by accident.

### Option A: Model autonomously rejects
- Pro: Fast, cheap
- Con: False positives frustrate users
- Risk: Can't be undone without human intervention

### Option B: Model escalates to human if uncertain
- Pro: Humans catch false positives
- Con: Queue fills up with ambiguous cases
- Risk: Humans become overwhelmed

### Option C: Model accepts by default, humans review flagged content asynchronously
- Pro: Users never blocked; humans get time to review
- Con: Harmful content temporarily available
- Risk: Slow response to serious violations

### Decision: Option B with escalation thresholds

### Autonomy Levels
| Content Type | Level | Rule |
|-------------|-------|------|
| Clear spam | 1 (Govern) | Auto-reject if confidence > 0.95 |
| Hate speech | 0 (Assist) | Always show to human with score |
| Copyright | 1 (Govern) | Flag for Legal team review |
| NSFW | 2 (Adapt) | Can auto-accept/reject within error budget |

### Anchors
- Model never sees user metadata (name, email)
- Model never modifies decisions already made by humans
- Model outputs always go to immutable audit log

### Budgets
- Can make mistakes, but false positive rate < 2%
- Must process each file in < 100ms
```

### Challenge 2: Predictive Scaling

**Scenario**: Your Back-End Bus needs to handle variable load. Next month you expect 10× traffic spike for a brief period. You want the system to scale *before* users notice latency.

**Your decisions**:
1. What signals indicate traffic will spike? (Time of day? External events? Search trends?)
2. How confident must predictions be before scaling? (95%? 80%? Depends on cost?)
3. Can the system scale down proactively? (Or only scale up?)
4. If predictions are wrong, what happens? (Cost overruns? User complaints?)
5. How do humans supervise this?

**Deliverables**:
1. **Signal diagram** — What observables feed the predictor?
2. **Decision tree** — At what confidence levels do different actions trigger?
3. **Budget analysis** — What's the cost of false positives vs false negatives?
4. **Rollback plan** — How does a human kill the auto-scaler if it breaks?

### Challenge 3: Model Drift Detection

**Scenario**: Your anomaly detection model was trained 6 months ago. Today it's rejecting 30% more uploads than it did last month.

**Problem**: Is this legitimate (spam increased) or model drift (learned the wrong pattern)?

**Your decisions**:
1. How do you detect model drift? (Compare to baseline? Check feature distributions? Watch class imbalance?)
2. When drift is detected, what happens automatically? (Revert to old model? Escalate to humans? Stop using AI?)
3. Who decides whether to retrain? (Data science team? Automated pipeline?)
4. How do you prevent this from happening again?

**Deliverables**:
1. **Monitoring dashboard** — What metrics indicate healthy vs drifted model?
2. **Auto-revert strategy** — Under what conditions do you go back to the previous model?
3. **Governance ADR** — Who authorizes retraining? What's the process?

---

## Building Intuition: The Autopilot Analogy (Expanded)

### Aviation's Approach to Autonomy

Modern airplanes have autopilot. But they didn't remove pilots.

```
1950s-1970s: Fully manual flight
  Pilot does everything
  Exhausting, error-prone, no time for planning

1980s-1990s: Assisted flight
  Autopilot handles cruising
  Pilot handles takeoff, landing, decisions
  Pilot watching constantly (supervisor role)

2000s-2020s: Governed autonomy
  Autopilot handles most flying
  Pilot monitors instrumentsMonitor for unusual conditions
  Pilot can override instantly
  Pilot handles emergencies

Future: Predictive autonomy
  System predicts problems before they occur
  Pilot reviews predictions (supervisor)
  System acts proactively

Key insight: Pilotsnever left. Their role changed.
```

**AI-native systems do the same**:
- Level 0: You're in full control (like 1950s pilot)
- Level 1: AI suggests, you decide (like 1980s assisted)
- Level 2: AI acts within bounds, you monitor (like modern autopilot)
- Level 3: AI fully autonomous, you handle emergencies (like future predicted autonomy)

A well-designed system moves decisions to higher autonomy *gradually*, only when proven safe.

---

## Common Questions

**Q: Isn't this just MLOps with extra steps?**  
A: No. MLOps manages *models*. This manages *decisions*. MLOps asks "Is the model training pipeline working?" This asks "Are we letting the model decide the right things?"

**Q: Can we just make everything Level 3 autonomous to save money?**  
A: Only if you can accept the consequences. Most real systems have a mix. Finance: mostly Level 0-1. Cloud platform auto-scaling: Level 2-3. Content filtering: Level 0-2 depending on severity.

**Q: What if AI makes mistakes?**  
A: That's why you have budgets. Mistakes are acceptable *in proportion to your budget*. If the model is 99% accurate but your domain can't tolerate 1% errors, keep it at Level 0 (humans decide).

**Q: Is this just "ask a human to review everything"?**  
A: No. It's "have AI make automatable decisions, and have humans make judgment calls." Large difference in efficiency.

**Q: How do I know if a model is ready for Level 2 or 3?**  
A: Metrics + time:
  - Accuracy > threshold (domain-specific)
  - Error rate stable for weeks
  - Post-incident reviews show errors are acceptable
  - Business stakeholders agree
  - Then: gradually increase autonomy on small subset
  - Then: monitor closely
  - Then: expand slowly

---

## Next Steps

1. **Pick a problem** (content moderation, scaling, fraud detection)
2. **Map current system** (where are decisions today?)
3. **Insert AI** (what could AI decide?)
4. **Choose autonomy levels** (per decision type)
5. **Define anchors & budgets** (what can never happen?)
6. **Design HITL** (where do humans intervene?)
7. **Write ADRs** (justify your choices)
8. **Present to class** (explain your governance model)

---

**Key Takeaway**: AI-native systems aren't about removing humans. They're about **positioning humans in the decisions that matter most, while letting AI handle what it's good at—all without losing trust or control**.

That is the skill of Week 07.
