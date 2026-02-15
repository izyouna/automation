# Week 08: Multi-Agent & Collective AI Systems

> **Key Concept**: A single AI can decide. **A system of AIs must coordinate**.
> Week 08 teaches you how to architect multi-agent systems where many AI actors work together, disagree, and adapt—*without losing safety, governance, or human oversight*.

## Learning Objectives

By the end of this week, you will understand:

1. **Single vs Collective Intelligence** — When you need multiple AI agents and how they differ from a single smart system
2. **Agent Roles & Boundaries** — How to decompose decision-making across agents safely
3. **Coordination Patterns** — How agents communicate and resolve disagreements without central control
4. **Emergent Failures** — Why multi-agent systems can fail mysteriously, and what to do about it
5. **Collective Governance** — How to enforce rules across the entire system, not just individual agents
6. **Humans as Meta-Agents** — How humans stay in charge when multiple AIs are working simultaneously

## The Problem We're Solving

**Week 07 Reality**: You built a single AI system with clear governance.

```
File Upload Service (Week 07)
  ├─ Malware detector (Level 1: auto-reject if 95% confident)
  ├─ Privacy checker (Level 0: always escalate to human)
  └─ Compression optimizer (Level 3: fully autonomous)
```

**New reality (Week 08)**: Your system is growing. One AI isn't enough anymore.

```
File Upload Service (Week 08)
  ├─ Malware detector AI
  ├─ Privacy checker AI
  ├─ Spam detector AI
  ├─ Copyright checker AI
  ├─ Compression optimizer AI
  ├─ Cost optimizer AI
  ├─ Performance monitor AI
  └─ ⚠️ All these agents have different goals and see different data
```

**New problems**:
- Malware detector says "reject"; Privacy checker says "requires review"; Copyright checker approves. Who decides?
- Cost optimizer tries to save money. Malware detector wants to run expensive scans. They conflict.
- One agent predicts high load and scales up. Another agent predicts low load and scales down. They oscillate.
- The system as a whole should reject < 2% of files. But no single agent knows this quota. Some agents might exceed their share.
- An agent learns to exploit a loophole and behaves in ways humans didn't intend.

**These problems don't happen with a single agent.** But they *must* happen with multiple agents, because each agent has a partial view.

**Your job**: Design architecture so the system *as a whole* remains governable, even when individual agents act autonomously.

---

## How Week 08 Builds on Previous Weeks

```
Week 01: Protocol boundaries & explicit structure
   ↓ "Messages have clear frame"

Week 02: Stateless vs stateful decisions
   ↓ "You choose where memory lives"

Week 03: Microservices & async events
   ↓ "Services work independently"

Week 04: Zero-trust security & audit
   ↓ "Everything is verified & logged"

Week 05: Edge & Back-End Bus architecture
   ↓ "Hide complexity behind boundaries"

Week 06: Architecture reasoning & evolution
   ↓ "Decide how systems change"

Week 07: Governed autonomy & single AI
   ↓ "Decide how systems decide"

Week 08: Multi-agent & collective AI
   ↓ "Decide how multiple systems decide together"
   = Apply everything above to coordinate multiple AI actors
```

Key progression:
- Week 07: One AI, clear accountability, human can always override
- Week 08: Many AIs, distributed accountability, humans override *the system* not individual agents

---

## The Restaurant Kitchen Analogy (Expanded)

### Week 07: Single Smart Chef

```
Order comes in
  ↓
Chef (AI):
  ├─ Checks inventory (sees full picture)
  ├─ Decides how to cook
  ├─ Decides portion size
  ├─ Decides plating
  └─ Sends to customer
  
Manager (human):
  └─ Can tell chef to redo a dish
```

**Simple**: One decision-maker, clear responsibility.

### Week 08: Modern Kitchen (Brigade System)

```
Order comes in
  ↓
Order AI (reads order)
  ├─→ Pantry AI (finds ingredients)
  ├─→ Timer AI (manages cooking time)
  ├─→ Quality AI ( 检查 texture, temperature)
  ├─→ Cost AI (optimizes waste)
  ├─→ Speed AI (routes to fastest station)
  └─→ Plating AI (arranges dish)
       ↓
    [Dish goes to customer]
```

**Complex**: Multiple AIs with different goals.
- Cost AI wants to use cheap oils.
- Quality AI wants premium butter.
- Speed AI wants pre-made sauces.
- They compete for the same resources (budget, time, ingredients).

**What happens?**
- If one agent makes a decision without consulting others → inefficiency or conflict
- If all agents must agree → deadlock
- If one agent dominates → ignores others' goals
- If agents don't communicate → dish gets messed up

**Solution**: Structure the kitchen (architecture) so:
1. Each AI has a clear role and scope
2. They communicate about conflicts
3. A supervisor (human) enforces final rules
4. No single AI can break the restaurant's reputation

---

## Three Coordination Patterns You Need to Know

### Pattern 1: Sequential (Pipeline)

```
Agent A finishes
  ↓
Agent B starts (sees A's output)
  ↓
Agent C starts (sees B's output)
  ↓
Result
```

**Example**: Upload → Malware check → Privacy check → Spam check → Store

**Pro**: Each agent sees previous decisions, can reason about them  
**Con**: Any agent failure blocks the entire pipeline  
**Use when**: Decisions must happen in order, each builds on previous

### Pattern 2: Parallel (Vote)

```
Agent A
   ↓ (all see input)
Agent B  → [Vote/Merge] → Result
   ↓
Agent C
```

**Example**: Malware detector says "risky" (80%), Privacy checker says "safe" (95%), Spam detector says "risky" (70%)

**Pro**: No single point of failure; multiple perspectives  
**Con**: Must resolve disagreements; risk of groupthink

**Use when**: Same decision needs multiple viewpoints

**How to resolve disagreement?**

```python
# Option 1: Majority vote
if sum(scores > 0.5) >= 2:  # At least 2 agents agree it's risky
    escalate_to_human()

# Option 2: Consensus + veto
if all(score < 0.9 for score in scores):  # No agent is extremely confident
    escalate_to_human()

if any(score > 0.95 for score in scores):  # One agent is very confident
    follow_that_agent()

# Option 3: Weighted by domain expertise
malware_weight = 0.5  # Trust this expert more
privacy_weight = 0.3
spam_weight = 0.2

score = (malware_weight * malware_score + 
         privacy_weight * privacy_score +
         spam_weight * spam_score)
if score > threshold:
    reject()
```

### Pattern 3: Centralized Authority (with Bypass)

```
[Authority Agent]
     ↓ (makes final decisions)
[Executor Agents]
     ↓
   Result
     
But: Humans can override Authority Agent
```

**Example**: Cost Optimizer Agent decides resource allocation, but Budget Owner (human) can veto

**Pro**: Clear decision-maker, predictable behavior  
**Con**: Authority is a bottleneck

**Use when**: One goal must dominate (e.g., safety > cost)

---

## Core Concepts: Multi-Agent Architecture Patterns

### 1. Agent Roles & Visibility Boundaries

Each agent is an architectural component. Define:

**What can agent see?**
```python
class MalwareDetector:
    can_see = {
        "file_content": True,         # Actual bytes
        "file_metadata": True,        # Size, type, hash
        "user_id": False,             # Can't see who uploaded
        "pricing_info": False,        # Doesn't care about cost
    }

class CostOptimizer:
    can_see = {
        "file_content": False,        # Doesn't need actual bytes
        "file_metadata": True,        # Needs size to estimate cost
        "user_id": False,             # Doesn't care who
        "pricing_info": True,         # Needs cost data
        "load_level": True,           # Sees how busy system is
    }
```

**Why restrict visibility?**
- **Security**: Sensitive data doesn't leak to agents that don't need it
- **Performance**: Agents only process what matters
- **Clarity**: Easy to audit what each agent knows
- **Governance**: Can prove certain agents can't make certain decisions

### 2. Distributed Budgets (Global Constraints)

In a single-agent system:
```
Reject budget: can reject up to 5% of uploads
```

In a multi-agent system (each agent has a partial view):
```
Global constraint: reject up to 5% total
  ├─ Malware detector: can reject up to 3%
  ├─ Privacy checker: can reject up to 1%
  ├─ Spam detector: can reject up to 1.5%
  └─ (They might exceed together, so need coordination)
```

**Implementation**:
```python
# Global budget tracker
class RejectionBudget:
    total_budget = 0.05  # 5%
    used = 0.0
    per_agent_budget = {
        "malware": 0.03,
        "privacy": 0.01,
        "spam": 0.015,
    }
    
    async def can_agent_reject(agent_name: str, confidence: float):
        agent_budget = per_agent_budget[agent_name]
        
        # Did this agent exceed its own budget?
        if agent_used[agent_name] >= agent_budget:
            return False  # Agent out of budget
        
        # Did we exceed global budget?
        if used + (1.0 / total_files) >= total_budget:
            return False  # System out of budget
        
        # OK to reject
        return True
```

**Key insight**: No single agent knows the global picture. The *system* enforces the collective constraint.

### 3. Emergent Failures (Why Multi-Agent is Hard)

Multi-agent systems can break in ways that don't involve buggy code.

**Failure 1: Feedback Loop**

```
Agent A: "Too much traffic → scale up"
Agent B: "Scaling costs money → scale down"
Agent A: "Sees scale-down → costs money → scale up"
Agent B: "Sees scale-up → traffic increased → scale down"

Result: System oscillates forever
(No agent is wrong; together they create chaos)
```

**Detection**: Monitor metric variance. If standard deviation of "current instances" is high, feedback loop is happening.

**Prevention**: Add damping.
```python
# Don't react immediately; require sustained signal
if average_cpu_over_5min > 0.8:
    scale_up()
else:
    scale_down()
```

**Failure 2: Collusion**

```
Agent A gets incentive: "Minimize CPU usage"
Agent B gets incentive: "Minimize response time"

Both agents learn: "Don't actually process the file"
Result: System silently discards data
```

**Detection**: Have a third agent that monitors outcomes (e.g., "Are files actually being processed?")

**Prevention**: Agents can't both optimize for opposite goals without a governor.

**Failure 3: Mode Collapse**

```
Agent (ML model): Trained on diverse data
Over time: Only makes decisions in one mode
Example: Content moderator only rejects (never accepts)
```

**Detection**: Monitor decision distribution. If 95%+ of decisions are the same type, something's wrong.

**Prevention**: Have humans review periodically; retrain if needed.

### 4. Collective Anchors (System-Level Invariants)

Anchors aren't about individual agents. They're about the system as a whole.

**Examples**:
```
Anchor 1: "Across all agents, never reject a file from premium users"
Anchor 2: "Across all agents, total processing cost < budget"
Anchor 3: "Across all agents, at least one agent must flag anything flagged"
```

**Implementation**:
```python
class CollectiveAnchor:
    """Enforce system-level invariants."""
    
    async def check_after_all_agents_decide(self, decisions: List[Decision]):
        """Called after all agents finish."""
        
        # Anchor 1: Premium users never get rejected
        for decision in decisions:
            if decision.user.is_premium and decision.action == "reject":
                raise AnchorViolation("Premium user was rejected")
        
        # Anchor 2: Total cost < budget
        total_cost = sum(d.processing_cost for d in decisions)
        if total_cost > monthly_budget:
            raise AnchorViolation(f"Budget exceeded: {total_cost}")
        
        # If anchor violated, what happens?
        # Option A: Reject the entire batch
        # Option B: Go back and get different decisions from agents
        # Option C: Escalate to human
```

### 5. Humans as Meta-Agents

When agents disagree, someone must decide. Often that's a human.

**Bad HITL in multi-agent systems**:
```
All agents decide
  ↓
Human sees result
  ↓ (Too late to influence)
Human logs complaint
```

**Good HITL in multi-agent systems**:
```
Agents start deciding
  ↓
Real-time check: "Are agents disagreeing on something important?"
  ├─ Yes → Ask human for tiebreaker
  │  "Malware detector says reject (80%)"
  │  "Privacy checker says accept (90%)"
  │  "What's your call, human?"
  │
  └─ No → Proceed automatically
```

**Implementation**:
```python
async def resolve_agent_disagreement(agent_decisions: Dict[str, Decision]):
    """When agents disagree, ask a human."""
    
    unique_decisions = set(d.action for d in agent_decisions.values())
    
    if len(unique_decisions) == 1:
        # All agree; proceed
        return agent_decisions.values()[0]
    
    if len(unique_decisions) > 1:
        # Agents disagree
        
        # Is disagreement acceptable?
        confidence_range = max(d.confidence for d in agent_decisions.values()) - \
                          min(d.confidence for d in agent_decisions.values())
        
        if confidence_range < 0.2:  # All agents fairly uncertain
            # Human decides
            human_decision = await escalation_queue.get_decision(
                agent_decisions=agent_decisions,
                timeout=30  # seconds
            )
            return human_decision
        
        else:
            # One agent very confident, others not; follow the confident one
            most_confident = max(agent_decisions.values(), key=lambda d: d.confidence)
            return most_confident
```

---

## Project Structure

```
week08-multi-agent-systems/
├── decisions/
│   ├── ADR-001-agent-decomposition.md    # Why these agents exist
│   ├── ADR-002-coordination-pattern.md   # How they talk to each other
│   ├── ADR-003-emergent-risks.md         # What failures to watch for
│   └── ADR-004-collective-governance.md  # Scaling rules
│
├── diagrams/
│   ├── agent-mesh.mmd                    # Peer-to-peer communication
│   ├── collective-constraints.mmd        # Global budgets & anchors
│   ├── escalation-paths.mmd              # When humans intervene
│   └── failure-scenarios.mmd             # Feedback loops, etc.
│
├── examples/
│   ├── agent_roles.py                    # Visibility boundaries
│   ├── coordination_patterns.py          # Sequential, parallel, centralized
│   ├── collective_budgets.py             # Shared constraints
│   └── emergent_failure_detection.py     # Monitoring for failure modes
│
└── README.md
```

---

## Lab: Design a Multi-Agent File Processing System

### Part 1: Agent Decomposition

Your file upload service now processes files with 4 goals:
1. **Security** (malware, exploits, suspicious patterns)
2. **Privacy** (PII detection, encryption, redaction)
3. **Compliance** (copyright, licensing, retention rules)
4. **Efficiency** (compression, caching, cost optimization)

**Your task**:
1. Create 4 agents, one per goal
2. Define what each agent can see (input data)
3. Define what each agent can do (possible actions)
4. Define what each agent can never do (anchors)

**Deliverable**: Agent definition document

```markdown
## Agent 1: Security Guardian

### Goal
Detect and prevent malicious uploads.

### Input (what can it see?)
- File content (raw bytes)
- File metadata (size, type, name)
- Upload patterns (from same source recently?)
- ✗ User identity (can't bias against users)
- ✗ Pricing info (doesn't care about cost)

### Output (what can it decide?)
- Reject (if confidence > 95%)
- Flag for review (if confidence 70-95%)
- Accept (if confidence < 70%)

### Anchors (what can it never do?)
- Never reject a file that's already been approved
- Never use user ID in decision (could be discriminatory)
- Never modify the file

### Budget
- Can reject up to 3% of uploads
```

### Part 2: Coordination Pattern

Choose one:
- **Sequential**: Security → Privacy → Compliance → Efficiency
- **Parallel (voting)**: All 4 agents decide independently, then combine results
- **Centralized**: One agent (e.g., Security) has veto power

**Your task**:
1. Explain why you chose this pattern
2. Draw the interaction diagram
3. Write the decision-merge logic (how do you combine results from all agents?)
4. Explain what happens when agents disagree

**Deliverable**: ADR explaining coordination choice

### Part 3: Emergent Risks

Identify 3 potential failures:

1. **Feedback loop**: Cost optimizer scales down to save money. Security agent needs more compute to scan. Cost agent scales down more. Loop.
   - Detection: Monitor compute allocation variance
   - Prevention: Scale only after stable signal over 5 minutes

2. **Collusion**: Privacy agent learns "reject everything to avoid PII leaks." Security agent learns "reject everything to be safe." Files never move.
   - Detection: Monitor file acceptance rate (should be > X%)
   - Prevention: Have a "throughput" agent that vetos reject-happy agents

3. **Silent mode collapse**: Compliance agent trained on music/movie downloads. Over time, only says "copyright violation" (never "approved").
   - Detection: Monitor decision distribution (should have variety)
   - Prevention: Human audits decisions monthly

**Deliverable**: Failure scenario analysis

### Part 4: Collective Governance

Define system-level rules:

```markdown
## Global Constraints

### Throughput Anchor
- At least 95% of uploads must be accepted or flagged (not rejected)
- Why: Business needs files to move; rejections should be rare

### Fairness Anchor
- No user should have rejection rate > 3× the system average
- Why: Prevent discrimination

### Cost Anchor
- Processing cost per file < $0.10 average
- Why: Business economics

### Auditability Anchor
- Every decision by every agent must be logged
- Why: If something goes wrong, need to understand why

## How Agents Share Budgets
- Security can reject up to 3%
- Privacy can reject up to 1%
- Compliance can reject up to 1%
- Total never exceeds 5%

## When Humans Intervene
- If acceptance rate drops below 90% → escalate to product team
- If any user's rejection rate > 3× average → escalate to fairness team
- If cost per file > $0.12 → escalate to infra team
```

**Deliverable**: Collective governance ADR

---

## Common Questions

**Q: Isn't this just orchestration?**  
A: Orchestration = telling agents what to do in order. This is = setting rules and letting agents figure it out. Very different complexity levels.

**Q: What if agents keep disagreeing?**  
A: That's what humans are for. But architecture should make disagreement *visible* and manageable, not hidden.

**Q: Can we have 10+ agents?**  
A: Yes, but coordination complexity grows. At some point, you need a hierarchy (agents manage agents). That's Week 08+ advanced topic.

**Q: What if the collective anchor is violated?**  
A: Depends on the anchor's importance. "Never violate" anchors stop the system. "Minimize violations" anchors escalate to humans for exception handling.

**Q: How do we test multi-agent systems?**  
A: Test invariants, not individual decisions:
  - Run agents; check: "Did we stay within budget?"
  - Run agents; check: "Is acceptance rate > 95%?"
  - Run agents; check: "Did we detect the injected failure mode?"

---

## Building Intuition: From Orchestra to Jazz Ensemble

### Orchestra (Single Conductor, like Week 07)

```
Conductor: "Violins, play softer"
Violins: Play softer

All musicians follow one authority.
Very coordinated, but no individual creativity.
```

### Jazz Ensemble (Multi-Agent, like Week 08)

```
Bassist: Playing a strong groove
Trumpet: Improvising over the groove
Drums: Following both while adding fills

No single authority, but:
• Everyone is trained to listen
• They have shared rules (key, tempo)
• The producer (human) can say "stop, too loud"
• But musicians mostly coordinate themselves
```

**Jazz coordinator (Architecture)** must answer:
- How loud can each player be? (Budget)
- What keys are allowed? (Anchors)
- If trumpet goes off-key, what does bassist do? (Escalation)
- How often do humans intervene? (HITL)

---

## Next Steps

1. **Pick a domain** (content moderation, cloud optimization, resource allocation)
2. **Identify at least 4 agents** with different goals
3. **Choose coordination pattern**
4. **Identify emergent risks** (brainstorm 5+)
5. **Define collective anchors** (what never gets violated)
6. **Design human meta-agent role** (when humans decide)
7. **Write ADRs** (justify your choices)
8. **Present to class** (explain the system)

---

**Key Takeaway**: Multi-agent systems aren't about having multiple AIs. They're about **designing systems where multiple AIs with different goals can work together safely, without losing control or trust**.

That's the skill of Week 08—and it's the foundation for everything that happens at scale.
