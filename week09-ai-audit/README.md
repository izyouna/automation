# Week 09: AI Audits, Accountability & Regulation

> **Key Concept**: An AI system that cannot be audited cannot be trusted—*regardless of performance*.
> Week 09 teaches you how to architect AI systems that are inspectable, accountable, and legally defensible while preserving adaptability.

## Learning Objectives

By the end of this week, you will understand:

1. **Auditability as Architecture** — Why decisions must be traceable, not just correct
2. **Accountability Chains** — Who is responsible for what, and how to prove it
3. **Evidence Pipelines** — How to build the forensic layer of AI systems
4. **Regulatory Translation** — How to turn laws into system constraints
5. **Post-Incident Learning** — How to investigate failures safely and improve without repeating them
6. **Trust as a System Property** — Why regulators, users, and society care about these questions

## The Problem We're Solving

**Week 08 Reality**: You built a multi-agent AI system that works well and stays within governance constraints.

```
System operates successfully:
  ✓ Agents coordinate
  ✓ Budgets are respected
  ✓ Humans intervene when needed
  ✓ Performance metrics look good
```

**New reality (Week 09)**: Something unexpected happens.

```
A user complains: "My file was rejected unfairly."

System says: "ML model's confidence was 0.82, so it was rejected."

User's lawyer asks: "What data did this model see? Who trained it? 
                    Was the decision being reviewed? 
                    Can you prove the model wasn't biased?"

Regulator asks: "Can you explain why this happened? Is this policy correct?
               Who is accountable if it was wrong?"

Your team asks: "How do we investigate without re-running the system?
               How do we know if this was a one-off or a pattern?
               How do we fix it safely?"
```

**These questions can only be answered if the system was designed to be auditable.**

**Example**: Your content moderation system rejected a post from a marginalized community at 10x the rate of other populations.

```
Question 1: "Is the model biased?"
  → Need: Training data snapshot, model version, decision trace
  
Question 2: "Was this illegal discrimination?"
  → Need: Protected class information (if stored), decision dates, appeal records
  
Question 3: "How do we fix this?"
  → Need: Can we retrain without harming other groups?
         Can we audit historical decisions?
         Can we flag similar cases for human review?
```

**Without audit architecture, you can't answer any of these questions.**

---

## How Week 09 Builds on Previous Weeks

```
Week 01: Protocols & explicit structure
   ↓ "Messages have clear boundaries"

Week 02: State management decisions
   ↓ "Where does memory live?"

Week 03: Microservices & decomposition
   ↓ "Services work independently"

Week 04: Zero-trust security & audit
   ↓ "Everything is verified & logged"

Week 05: Bus architecture & boundaries
   ↓ "Hide complexity safely"

Week 06: Architecture reasoning & evolution
   ↓ "Decide how systems change"

Week 07: Single-agent AI & governance
   ↓ "Decide how systems decide"

Week 08: Multi-agent coordination
   ↓ "Decide how systems decide together"

Week 09: Audits, accountability & regulation
   ↓ "Prove everything is legal, fair, and understandable"
   = Make the entire system inspectable & trustworthy
```

Week 09 doesn't add new features. It makes every previous week **auditable**.

---

## Three Fundamental Truths About Audits

### Truth 1: Auditability Cannot Be Added Later

**Bad approach**:
```
Build system → Run for 6 months → Regulator asks questions
Result: "Sorry, we didn't keep those logs"
```

**Good approach**:
```
Design audit from day 1 → Build system with audit embedded
Result: Can answer any question
```

**Why?** The decisions that matter most are *already made*. If they weren't logged, they can't be audited.

Example: Your ML model was trained on data that includes protected characteristics (race, gender).

```
If not logged during training:
  Developer: "It's possible the model learned bias, but we can't check."
  Regulator: "Unacceptable."

If logged during training:
  Developer: "Model saw race as feature. We can show how much it used it."
  Regulator: "Good. Now let's investigate."
```

### Truth 2: Accountability Requires Clear Chains

Every decision must have an answer to: **"Who is responsible?"**

```
Bad accountability:
  "The system did it."
  (No single person responsible)

Good accountability:
  "On 2026-02-09 at 14:23:01, 
   Decision ID abc123 was made by Model v2.1
   Policy v3.2 authorized it
   Input: file hash xyz
   Human escalation: not required
   Confidence: 0.82
   Reviewer: alice@company.com (approved)"
  → Multiple people accountable for different parts
```

### Truth 3: Evidence Is Structured, Not Just Logged

**Bad evidence**:
```
log: "File rejected at 14:23"
log: "Model output was 0.82"
log: "File stored in /uploads/xyz"
(Random strings that mean nothing)
```

**Good evidence**:
```
{
  "event_id": "abc123",
  "timestamp": "2026-02-09T14:23:01Z",
  "decision_type": "file_upload_approval",
  "agent_making_decision": "malware_detector",
  "input": {
    "file_hash": "sha256:...",
    "file_size": 1024,
    "file_type": "application/pdf",
    "user_id": "user_anon_hash"  # Never raw user ID
  },
  "model_metadata": {
    "version": "v2.1",
    "trained_on": "2026-01-15",
    "training_dataset": "dataset_v42"
  },
  "policy": {
    "version": "v3.2",
    "section": "4.1",
    "text": "Models can auto-reject if confidence > 0.95"
  },
  "agent_decision": {
    "action": "reject",
    "confidence": 0.82,
    "rationale": "Suspicious entropy pattern"
  },
  "escalation": {
    "required": false,
    "human_review": false
  },
  "budget": {
    "agent_rejection_budget_used": "3.2%",
    "agent_rejection_budget_limit": "3.0%",
    "violation": true
  },
  "audit_trail": [
    "decision_made",
    "budget_checked",
    "violation_flagged",
    "escalation_queued"
  ]
}
```

This is **structured evidence**. An auditor, lawyer, or regulator can understand exactly what happened and why.

---

## Core Concepts: Building Audit Architecture

### 1. Accountability Chains (Who Did What?)

Every AI system has multiple actors. Define who is responsible for each part:

```
Data Owner
  ↓ (responsible for: origin, quality, consent)
  
Data Scientists
  ↓ (responsible for: model design, training process, validation)
  
Model v1.2
  ↓ (produces: predictions with confidence, explainability)
  
Policy v3.2 (written by: Product Team)
  ↓ (responsible for: when model is trusted, when humans override)
  
AI Agent (operates under policy)
  ↓ (responsible for: following policy, logging all decisions)
  
Human Reviewer (when escalated)
  ↓ (responsible for: final call, documenting rationale)
  
System
  ↓ (responsible for: executing approved decision, logging everything)
```

**The key rule**: Nobody is "just following orders." Each actor documents their decision and reasoning.

### 2. Immutable Event Logs (The Forensic Layer)

Every significant decision goes to an immutable log that:
- Cannot be deleted or modified
- Is cryptographically signed
- Is stored separately from the application
- Is accessible to auditors

```python
class AuditEvent:
    """Immutable audit log entry."""
    timestamp: datetime
    decision_id: str  # Unique ID for this decision
    agent_name: str
    inputs: Dict  # What the agent saw
    output: Dict  # What the agent decided
    policy_version: str
    human_involved: bool
    actor_id: Optional[str]  # If human approved, who?
    
    def to_evidence(self) -> str:
        """Convert to sealed evidence record."""
        return hash_and_sign(
            serialize(self),
            private_key
        )

# Usage:
event = AuditEvent(
    timestamp=now(),
    decision_id=uuid4(),
    agent_name="malware_detector",
    inputs={"file_hash": "...", "file_size": 1024},
    output={"action": "reject", "confidence": 0.82},
    policy_version="v3.2",
    human_involved=False,
    actor_id=None
)

await audit_store.append(event.to_evidence())
# Later: audit_store prevents modification
```

### 3. Policy Snapshotting (Version Everything)

When a decision is made, capture *which version of the policy* authorized it.

```python
# Decision made on 2026-02-09
decision = {
    "timestamp": "2026-02-09T14:23:01Z",
    "action": "reject",
    "policy_snapshot": POLICY_V3_2  # Entire policy text stored
}

# Later: Audit
# Policy updated to v3.3 (different rules)
# But we can see: "This decision was made under v3.2, section 4.1"
# So even if v3.3 would make it differently, we can justify v3.2
```

**Why this matters**: Policy changes over time. Decisions must be evaluated against the policy that was *in effect when they were made*, not retroactively.

### 4. Explainability & Decision Traces

Every autonomous decision must be explainable.

```python
async def explain_decision(decision_id: str) -> Explanation:
    """Reconstruct why a decision was made."""
    
    event = await audit_store.get(decision_id)
    
    return Explanation(
        what_happened=f"File rejected at {event.timestamp}",
        why_it_happened=f"Malware detector confidence was {event.confidence}",
        who_decided="malware_detector (ML model v2.1)",
        what_policy_said=POLICY_V3_2.__dict__,
        what_data_was_used={
            "file_size": event.inputs["file_size"],
            "file_type": event.inputs["file_type"],
            # Sensitive data (user_id) NOT included in explanation
        },
        could_human_override=True,
        was_human_involved=event.human_involved
    )
```

### 5. Incident Replay & Post-Incident Learning

After a failure, you must be able to:
1. Replay the exact decision that was made
2. Understand why it was made
3. Change policy and rerun the decision
4. Verify the new decision would be better
5. Deploy the new policy safely

```python
async def incident_replay(decision_id: str):
    """Investigate what went wrong."""
    
    event = await audit_store.get(decision_id)
    
    # 1. Get the original inputs
    original_inputs = event.inputs
    
    # 2. Get the model version that was used
    model = await model_registry.get(event.model_version)
    
    # 3. Get the policy that was used
    policy = await policy_store.get(event.policy_version)
    
    # 4. Replay: same inputs + same model + same policy
    replayed_decision = model.predict(original_inputs)
    assert replayed_decision == event.output  # Should match
    
    # 5. Now test: what if we used NEW policy?
    new_policy = POLICY_V3_3
    new_decision = apply_policy(model.predict(original_inputs), new_policy)
    
    if new_decision != event.output:
        print(f"New policy would decide: {new_decision}")
        print(f"Original policy decided: {event.output}")
        print(f"This explains the issue.")
        
        # 6. Before deploying new policy, test on historical decisions
        affected = await audit_store.query(
            policy_version="v3.2",
            agent="malware_detector"
        )
        
        improved_count = 0
        for affected_event in affected:
            old_decision = affected_event.output
            new_decision = apply_policy(
                model.predict(affected_event.inputs),
                new_policy
            )
            if is_better(new_decision, old_decision):
                improved_count += 1
        
        print(f"New policy would improve {improved_count}/{len(affected)} decisions")
```

---

## Translating Regulations into Architecture

### Example 1: "Right to Explanation"

**Regulation**: "Users must be able to understand why a decision was made about them."

**Architecture**:
```python
@app.get("/decisions/{decision_id}/explanation")
async def explain(decision_id: str, user_id: str):
    """User can access explanation of their own decision."""
    
    event = await audit_store.get(decision_id)
    
    # Verify user owns this decision
    if event.user_id != user_id:
        raise PermissionError()
    
    return {
        "what_happened": "Your file was rejected",
        "why": "Malware detector flagged suspicious patterns",
        "model_confidence": 0.82,
        "policy_rule": "Policy v3.2: Auto-reject if confidence > 0.95; escalate 0.7-0.95",
        "your_appeal_options": [
            "Request human review",
            "Resubmit with different file",
        ]
    }
```

### Example 2: "Data Minimization"

**Regulation**: "Collect only data necessary for the decision."

**Architecture**:
```python
class MalwareDetector:
    # Only sees file metadata, not user identity
    visible_fields = [
        "file_content",
        "file_size",
        "file_type",
        "file_hash"
    ]
    invisible_fields = [
        "user_id",  # Can't bias against users
        "user_email",
        "user_location",
        "pricing_info"
    ]
    
    async def predict(self, file_data):
        # Filter to visible fields only
        safe_inputs = {
            k: v for k, v in file_data.items()
            if k in self.visible_fields
        }
        return self.model.predict(safe_inputs)
```

### Example 3: "Human Oversight"

**Regulation**: "Certain decisions must involve human review."

**Architecture**:
```python
DECISION_LEVELS = {
    "file_upload": "Level 1",  # Auto-decide if confident, else escalate
    "user_ban": "Level 0",     # Always human
    "cache_invalidation": "Level 3"  # Fully autonomous
}

async def make_decision(decision_type: str, inputs):
    level = DECISION_LEVELS[decision_type]
    
    ai_output = await ai_model.predict(inputs)
    
    if level == "Level 0":
        # Always escalate
        await escalation_queue.add({
            "type": decision_type,
            "ai_recommendation": ai_output,
            "awaiting_human": True
        })
        return {"status": "pending_human_review"}
    
    elif level == "Level 1":
        if ai_output.confidence > 0.95:
            # High confidence; auto-decide
            await audit_log(decision_type, ai_output)
            return ai_output
        else:
            # Uncertain; escalate
            await escalation_queue.add(...)
            return {"status": "pending_human_review"}
    
    elif level == "Level 3":
        # Fully autonomous; auto-decide
        await audit_log(decision_type, ai_output)
        return ai_output
```

---

## Project Structure

```
week09-ai-audit-and-accountability/
├── decisions/
│   ├── ADR-001-auditability-first.md      # Why design for audit
│   ├── ADR-002-accountability-model.md    # Who is accountable for what
│   ├── ADR-003-evidence-pipeline.md       # What gets logged where
│   └── ADR-004-regulatory-mapping.md      # Laws → constraints
│
├── diagrams/
│   ├── accountability-chains.mmd          # Actor responsibilities
│   ├── evidence-flow.mmd                  # Audit data pathways
│   ├── incident-replay.mmd                # How forensic analysis works
│   └── regulatory-requirements.mmd        # Compliance architecture
│
├── examples/
│   ├── audit_events.py                    # Immutable event structure
│   ├── policy_snapshots.py                # Versioning & archives
│   ├── explainability.py                  # Decision explanation
│   └── incident_replay.py                 # Post-incident investigation
│
└── README.md
```

---

## Lab: Design an Audit-Ready AI System

### Part 1: Identify Regulations

Pick a domain:
- **Finance**: Credit scoring (Fair Credit Reporting Act, Equal Credit Opportunity Act)
- **Healthcare**: Patient triage (HIPAA, FDA AI guidelines)
- **Employment**: Hiring AI (EEOC, disparate impact law)
- **Content**: Moderation (CDA §230, emerging regulations)
- **Autonomous Vehicles**: Driving decisions (NHTSA, state laws)

**Your task**:
1. List 5 regulatory requirements for your domain
2. Explain what each one means in plain English
3. Identify who is accountable under each rule

**Deliverable**: Regulatory analysis document

### Part 2: Translate to Architecture

For each regulation, define:
- What data must be collected?
- What must be logged?
- Who has access?
- How long is it stored?
- What's the audit trail?

**Example for "Right to Explanation"**:

```markdown
## Regulation: "Right to Explanation"

### What it means:
User must be able to understand why a decision was made about them.

### Architecture:
1. Every decision has a `decision_id`
2. Decision is logged with:
   - Model version used
   - Policy version used
   - Inputs (sanitized, no sensitive data)
   - Confidence score
   - Human involved (yes/no)
3. User can call `/decisions/{id}/explanation` endpoint
4. System generates human-readable explanation
5. Explanation is also logged (for audit)

### Audit Requirements:
- Log retention: 3+ years
- Access control: Only user who owns decision
- Integrity: Logged explanation can't be modified
- Completeness: All decisions must be explainable
```

### Part 3: Design Incident Investigation

**Scenario**: A user group (e.g., women applicants) is rejected by your hiring AI at 2× the rate of men.

**Your task**:
1. How do you discover this (monitoring)?
2. How do you investigate (forensic layer)?
3. How do you fix it (policy change)?
4. How do you verify the fix (testing)?
5. How do you prevent it next time (architecture change)?

**Deliverable**: Incident response playbook

```markdown
## Incident: Gender Bias in Hiring AI

### Discovery
Monitoring alert: "Female acceptance rate (20%) << Male acceptance rate (40%)"

### Investigation
- Pull audit logs for all hiring decisions (past 6 months)
- Extract decisions for applicants marked as female
- Compare: What were the differences?
  - Were different models used?
  - Different policy versions?
  - Different inputs?
- Run incident replay:
  - Get decision_id for a denied female applicant
  - Replay with current model & policy
  - Does it still reject?
- Check model bias:
  - Training data: was it gender-balanced?
  - Feature importance: does model use gender as indicator?

...rest of investigation...
```

---

## Common Questions

**Q: Won't detailed audit logs slow down the system?**  
A: Not if designed right. Auditability is asynchronous; logging happens in parallel to decisions, not in the critical path.

**Q: What if we made a decision in the past we now regret?**  
A: Audit logs don't change. You can't retroactively make a decision unhappen. But you can:
  - Acknowledge it in records
  - Compensate affected users
  - Change policy going forward
  - Replay on similar cases

**Q: Does audit mean we can't do anything new?**  
A: No. Audit gives permission to try new things *safely*. You can test changes on a small population, logged fully, then expand if they work.

**Q: Who accesses audit logs?**  
A: Different people based on roles:
  - Developers: see their own system's logs
  - Auditors: see evidence for compliance review
  - Users: see explanations of their own decisions
  - Lawyers: see evidence for incidents
  - Regulators: see what they request

**Q: What happens to audit logs after regulations change?**  
A: Keep them. Historical decisions must be evaluated against their own era's regulations, not retroactively.

---

## Building Intuition: The Flight Data Recorder Analogy

### Aviation Black Box

```
Plane crashes.
Questions:
  "What happened?"
  "Why did it happen?"
  "Who is responsible?"
  "How do we prevent this?"

Black box answers all of them.
Contains immutable record of:
  - Every system state
  - Every decision pilot made
  - Every warning system gave
  - All audio/video

Result: Accident investigation can pinpoint causes.
Later: Regulations updated based on findings.
Safety improved.
Trust restored.
```

**AI systems need the same.**

Without audit logs, an AI accident is a mystery.
With audit logs, it's an opportunity to learn and improve.

---

## The Capstone: From Week 05 → Week 09

```
Week 05: Safe boundaries (architecture)
   → Edge & Back-End Bus separate public from private
   
Week 06: Smart evolution (reasoning)
   → Systems can adapt without breaking trust
   
Week 07: Governed autonomy (single AI)
   → AI decides within clear rules
   
Week 08: Collective coordination (multi-agent)
   → Many AIs work together safely
   
Week 09: Audit & accountability (proof)
   → Everything is inspectable, justifiable, learnable
   
Result: A system that can be trusted by users, 
        regulators, courts, and society.
```

---

## Next Steps

1. **Pick a regulated domain** (finance, health, employment, content)
2. **Research regulations** (What do laws actually require?)
3. **Map to architecture** (How do you enforce each requirement?)
4. **Design audit pipeline** (What gets logged, where, how accessed?)
5. **Build accountability model** (Who does what, who is responsible?)
6. **Simulate incident** (Practice forensic investigation)
7. **Write ADRs** (Justify your choices)
8. **Present to class** (Explain how your system is trustworthy)

---

**Key Takeaway**: Auditability isn't a burden. It's the foundation of trust.

Systems that can be inspected, questioned, and learned from are systems that last. Systems that can't be audited don't survive scrutiny.

Week 09 teaches you to build systems that survive—and improve from—the hard questions.

That is the final skill of the course.
