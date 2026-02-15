# Week 10: Capstone Project — Designing a Trustworthy AI System

> **Key Concept**: A capstone isn't a demo. It's an argument: *"Why should anyone trust this system to operate at scale?"*
> Week 10 is where you prove you can design, defend, and evolve a production-grade AI system.

## What Week 10 Is (And What It Isn't)

### It Is:
- ✅ A professional architecture defense
- ✅ A synthesis of weeks 01-09
- ✅ A portfolio piece (you'll be proud of this)
- ✅ A demonstration that you *think* like an architect
- ✅ An opportunity to influence how AI systems should be built

### It Isn't:
- ❌ A "build a working system in 2 weeks" sprint
- ❌ A coding contest or algorithm competition
- ❌ A presentation of existing code
- ❌ A test of your ability to memorize frameworks

**Success means**: "I understand the hard problems of building AI systems, how to think about them, and why my approach is defensible."

---

## The Core Challenge

Imagine you're interviewing for a staff engineer role at a major company. You're asked:

> "Design an AI system that:
> - Makes autonomous decisions
> - Adapts over time
> - Handles multiple objectives
> - Is governable by humans
> - Can be audited by regulators
> - Can evolve without catastrophic failure
>
> Why should we deploy this? What could go wrong? How do you prevent it?"

**Your capstone is your answer.**

You're not building the system. You're arguing why your system *should* be built (and how).

---

## How Week 10 Brings Everything Together

### Weeks 01-04: You Learned Foundations
```
Binary protocols → State machines → Distributed systems → Security
= How systems actually work at scale
```

### Weeks 05-09: You Learned Architecture at Scale
```
Boundaries → Reasoning → Single AI → Multi-Agent → Audit
= How to design systems that are safe, evolvable, and trustworthy
```

### Week 10: You Integrate Everything
```
       You pick a real problem
              ↓
    You design a solution
    using weeks 01-09 concepts
              ↓
    You defend that design
    against hard questions
              ↓
    You prove your thinking
    is that of an architect
```

---

## What Your Capstone Must Include (Non-Negotiable)

Every capstone must demonstrate understanding of:

### 1. **Boundary Architecture** (Week 05)
- Clear separation: what's public? What's private?
- Edge Bus for security enforcement
- Back-End Bus for high-performance internals
- Why this boundary exists and what it protects

**In your capstone, show**: "Here is where my system's perimeter is, and here's why I drew it there."

### 2. **Architectural Reasoning** (Week 06)
- Why did you make each choice?
- What trade-offs did you accept?
- What wasn't acceptable to you?

**In your capstone, show**: "Here are my 4 most important decisions and why I made them."

### 3. **AI Autonomy Levels** (Week 07)
- Where does AI decide alone?
- Where does it require human approval?
- How is confidence mapped to autonomy?

**In your capstone, show**: "Here's a decision matrix: for decision type X, AI operates at level Y because..."

### 4. **Multi-Agent Coordination** (Week 08)
- If you have multiple AI components, how do they work together?
- What conflicts can arise?
- How do you prevent emergent failures?

**In your capstone, show**: "My system has N agents with these roles. Here's how they communicate and resolve disagreements."

### 5. **Audit & Accountability** (Week 09)
- What evidence does your system produce?
- Who is accountable for what?
- Can an auditor/regulator inspect your system?

**In your capstone, show**: "When a decision is made, here's the immutable record. An auditor can see..."

### 6. **Human Governance** (Throughout)
- When do humans intervene?
- How can they override/escalate?
- How does learning flow back into the system?

**In your capstone, show**: "Here's how a human enters the system and changes a policy."

---

## Capstone Project Domains (Choose One)

Pick a domain that excites you. Your capstone will be proportional to your passion.

### Domain A: Cloud Intelligence Platform

**Example**: Autoscaling, cost optimization, reliability management

```
Problem: Cloud datacenter has 10,000 services across 50 regions.
  Need to:
  ✓ Scale up if load increases
  ✓ Scale down if load decreases
  ✓ Keep costs reasonable
  ✓ Maintain SLAs (no outages)
  ✓ Adapt to unpredictable demand

Challenge: If you scale up too early, you waste money.
           If you scale too late, users suffer.
           One team's cost optimization conflicts with another's reliability.
```

**Capstone focus**: Multi-agent system (cost AI, reliability AI, capacity AI) that coordinate to serve a global company.

### Domain B: Regulated Decision System

**Example**: Credit scoring, medical triage, insurance underwriting, government benefits eligibility

```
Problem: You must make decisions about people that affect their lives.
  Constraints:
  ✓ Decisions must be explainable
  ✓ Can't discriminate unlawfully
  ✓ Must be auditable for regulator
  ✓ Humans must review certain cases
  ✓ Wrong decisions have legal consequences

Challenge: ML models learn patterns. Some patterns are discrimination.
           How do you deploy AI while staying legal?
           How do you prove you weren't discriminatory?
```

**Capstone focus**: Architecture where AI makes suggestions, humans make final calls, every decision is auditable, regulators can inspect anytime.

### Domain C: Content Moderation at Scale

**Example**: Social media, video platform, marketplace

```
Problem: Platform gets 1M posts/hour. Humans can't review all.
  Need:
  ✓ Fast turnaround (users see decision in seconds)
  ✓ Accuracy (minimize false positives/negatives)
  ✓ Fairness (don't censor one group more than another)
  ✓ Appeal (users can challenge decisions)
  ✓ Learning (improve over time)

Challenge: One AI flag system rejects 70% of posts from minority communities.
           Is this bias in training data, or real difference in moderation needs?
           How do you investigate forensically?
           How do you fix without breaking other things?
```

**Capstone focus**: Multi-agent moderation (spam, hate speech, copyright, authenticity), audit system, human appeal process.

### Domain D: Autonomous Resource Optimization

**Example**: Traffic routing, energy grid management, supply chain coordination, dynamic pricing

```
Problem: You control a resource (traffic, power, inventory).
  Multiple parties (zones, customers, suppliers) have conflicting goals.
  Must optimize globally while respecting local constraints.

Challenge: If central authority decides everything, it's a bottleneck.
           If each party optimizes locally, chaos emerges.
           How do you architect for distributed decision-making
           that still serves the global good?
```

**Capstone focus**: Federated architecture where local agents optimize, global policies prevent conflicts, simulation shows long-term stability.

### Domain E: AI Governance Platform

**Example**: Internal tool for a company to govern its own AI systems

```
Problem: Your company deploys 100s of AI models.
  Compliance needs:
  ✓ Know which models are deployed
  ✓ Know what data they use
  ✓ Know who approves decisions
  ✓ Get alerts if a model drifts
  ✓ Audit any decision across any system
  ✓ Update policies globally

Challenge: You're building a system to govern other systems.
           It must be trustworthy, because everything depends on it.
           If it fails, all firewalls fail.
```

**Capstone focus**: Meta-architecture where the governance platform itself is auditable, resilient, and evolves carefully.

---

## Capstone Deliverables (What You Actually Turn In)

### Deliverable 1: Architecture Dossier (The Main Artifact)

Write a structured document (15–30 pages) covering:

#### Section A: Problem Context
- What problem are you solving?
- Why is it hard?
- Constraints and requirements

#### Section B: System Architecture
- Overview diagram(s) (Edge Bus, Back-End Bus, AI components)
- How data flows
- Where decisions are made
- Where humans intervene

#### Section C: Architectural Decisions (ADRs)
**Write 4–6 Architecture Decision Records**:
- Decision 1: Boundary placement (Edge vs Back-End)
- Decision 2: Protocol/coordination choice
- Decision 3: AI autonomy levels
- Decision 4: Multi-agent coordination pattern
- Decision 5: Audit/evidence design
- Decision 6: Evolution strategy

Each ADR should have:
- Context (why we had to decide)
- Options (what we could have done)
- Choice (what we chose)
- Reasoning (why this option)
- Trade-offs (what we're accepting)

#### Section D: Governance & Accountability
- Who decides what?
- Who is accountable?
- What happens if things go wrong?
- How are humans in the loop?

#### Section E: Audit & Regulation
- What evidence is produced?
- How would an auditor inspect this?
- What laws/regulations apply?
- How do you demonstrate compliance?

#### Section F: Evolution & Failure
- What's your plan to improve the system?
- What failures are you worried about?
- How will you detect them?
- How will you recover?

---

### Deliverable 2: Scenario Walk-Throughs

Write 3–4 detailed scenarios showing your system in action:

#### Scenario 1: Normal Operation
```
Timeline of a typical decision:
  T=0:00   Signal arrives at system
  T=0:01   Edge Bus receives, authenticates
  T=0:02   Routes to appropriate agent
  T=0:05   AI model makes prediction
  T=0:06   Prediction evaluated against policy
  T=0:08   Decision logged to audit trail
  T=0:10   User receives result

What evidence was produced?
What could an auditor see?
```

#### Scenario 2: Failure/Edge Case
```
Something goes wrong:
  - Prediction is highly uncertain
  - Budget is exceeded
  - Agent disagrees with another agent
  - Human override is needed

How does your system detect this?
What is the recovery path?
How is it logged?
```

#### Scenario 3: Regulatory Inquiry
```
Regulator asks: "Show me all decisions affecting user X"

Your system must:
  - Find all decisions
  - Explain each one
  - Show who was involved
  - Prove it was within policy
  - (Prove it wasn't discriminatory)

How does your architecture make this possible?
```

#### Scenario 4: Post-Incident Learning
```
Alert: "Decisions affecting Group Y are at 2× error rate"

What happens next?
  - Investigation (can you replay decisions?)
  - Root cause (was it the model, policy, or data?)
  - Fix (what changes?)
  - Validation (test before deploying)
  - Monitoring (how do you prevent recurrence?)

How is your system designed to support this?
```

---

### Deliverable 3: Diagrams (Make Them Good)

You'll have diagrams for:
- System architecture (boxes and lines, but with purpose)
- Data flow (where does information travel?)
- Decision flow (who decides what, in what order?)
- Escalation path (when human gets involved)
- Audit evidence flow (what gets logged where?)
- Failure scenario (what breaks, how recovery happens)

**Quality matters**: Diagram should be understandable to a senior engineer at 5 companies (someone who doesn't know your domain).

---

## Capstone Presentation (The Defense)

You'll present your capstone to the class and instructors. Think of it as a professional architecture review.

### Presentation Structure (20 minutes)

1. **Problem & Context** (3 min)
   - What are you building?
   - Why does it matter?
   - What are the constraints?

2. **Architecture Overview** (4 min)
   - Show the system architecture
   - Explain the big decisions
   - Why is it designed this way?

3. **Key Decisions & Trade-offs** (5 min)
   - "We had 3 options. We chose X because..."
   - "We accepted Y risk because..."
   - "We rejected Z because..."

4. **AI Governance & Human Control** (4 min)
   - Where does AI decide autonomously?
   - Where do humans intervene?
   - What prevents runaway AI?

5. **Audit & Failure** (4 min)
   - How is this system auditable?
   - What happens when it breaks?
   - How do you learn from failures?

### Q&A (10 minutes)

Be ready for tough questions like:
- "What happens if your assumption is wrong?"
- "Why this boundary and not that one?"
- "Can you prove this won't discriminate?"
- "Who is accountable?"
- "How do you evolve without breaking things?"

---

## Evaluation Rubric (How You're Graded)

We're evaluating **thinking**, not just deliverables.

| Criterion | What We're Looking For | Weight |
|-----------|------------------------|--------|
| **Architectural Clarity** | Can we understand your design? Is it coherent? Would another architect agree it's thoughtful? | 25% |
| **Decision Reasoning** | Do you justify your choices? Do you acknowledge trade-offs? Do you show you *thought*? | 25% |
| **AI & Governance** | Do you understand autonomy levels? Can you govern AI? Is human control clear? | 25% |
| **Auditability** | Is your system inspectable? Can regulators/auditors review decisions? Is accountability clear? | 25% |

**Grading notes**:
- Code quality: Optional (simulation is fine)
- Completeness: Partial systems are OK if you explain the gaps
- Originality: Nice, but clarity matters more
- Confidence: Show you know what you know; admit what you don't

---

## Tips for Success

### Tip 1: Be Bold, But Justified
- Pick a real, hard problem.
- Don't oversimplify.
- But explain why you simplified where you did.

### Tip 2: Show Your Thinking, Not Just Results
- The journey is more important than the destination.
- Include failed approaches and why they didn't work.
- Show trade-offs and why you made each choice.

### Tip 3: Admitting Unknowns Is Honest
- "I don't know how to handle this yet" is better than pretending you solved it.
- "This is a known open problem in the field..."
- Show awareness of limitations.

### Tip 4: Make Your Audit Architecture Shine
- This is where most students are weak.
- Spend time here. Show how your system produces evidence.
- This alone can elevate an OK capstone to a great one.

### Tip 5: Practice the Presentation
- You're arguing for your system.
- Know your material.
- Be ready to defend decisions.
- Strong presenters look like architects.

---

## Group Capstones (If You Do This as a Team)

Capstones can be done individually or in groups (2–4 people).

**Group capstones are harder, not easier.**

Requirements:
1. Joint architecture dossier (everyone signs)
2. Clear role divisions (who owns which ADR?)
3. Each person defends their section
4. Instructors ask each person hard questions
5. All must demonstrate equal depth

**Avoid**: One person does everything; others present.

---

## How This Prepares You for Your Career

Completing this capstone demonstrates mastery of:

✓ **System thinking** — Understanding complex systems holistically  
✓ **AI governance** — How to deploy AI safely at scale  
✓ **Architectural reasoning** — Making hard trade-off decisions  
✓ **Communication** — Explaining design to others clearly  
✓ **Professional judgment** — Knowing what you know, admitting unknowns  

These skills qualify you for roles like:
- **Senior Software Engineer** — You can design resilient systems
- **Staff Engineer** — You think about systems at company scale
- **AI Systems Architect** — You understand AI governance
- **Technical Lead** — You can guide teams through hard decisions
- **Principal Engineer** — You have the trust that comes from sound thinking

---

## Real-World Examples (What Great Capstones Look Like)

### Example Capstone 1: "Autoscaling for a Global Company"

**Problem**: Google-scale datacenter needs to serve 1B users globally, costs $100M/year.

**Architecture**:
- Edge Bus: Load balancers in each region
- Back-End Bus: Service mesh with gRPC
- AI 1: Load prediction (predicts traffic 1 hour ahead)
- AI 2: Cost optimizer (finds cheapest way to serve load)
- AI 3: Reliability checker (ensures SLA won't be missed)
- Humans: SRE override panel

**Key decision**: Cost optimizer proposes, reliability checker vetoes, humans approve.

**Novel aspect**: Demonstrated how to coordinate 3 conflicting AIs (cheap ≠ reliable) while keeping humans in charge.

### Example Capstone 2: "Medical Triage AI for Emergency Rooms"

**Problem**: ER gets 500 patients/day. Can't manually triage all. Lives depend on correct prioritization.

**Architecture**:
- Edge Bus: Hospital network, HIPAA compliant
- AI: Severity scoring (based on symptoms, vitals)
- Escalation: Doctor always makes final call for top priority
- Audit: Every decision logged (legal requirement)

**Key decision**: AI recommends, doctor approves before action.

**Regulatory focus**: Detailed how system satisfies HIPAA + FDA AI guidelines.

**Failure scenario**: AI recommends low-priority for chest pain. Doctor overrides, finds MI. System investigated and retrained.

---

## The Capstone Defense: What Happens

### Day of Presentation

```
You stand up and argue:
  "Here's a hard problem.
   Here's why it's hard.
   Here's my proposed system.
   Here are the 5 decisions I made.
   Here's why each decision is defensible.
   Here's what fails and my mitigation.
   Here's why you should trust this."

Instructors/peers ask hard questions:
  "Why this boundary, not that?"
  "What if your assumption is wrong?"
  "Can you prove it won't discriminate?"
  "Who is accountable?"

You answer clearly, or admit you don't know.

Result: Everyone understands your thinking.
        They may not all agree, but they respect it.
```

---

## Capstone Success: What It Means

Successful capstone = people come away thinking:

> "They've thought deeply about the hard problems.
> They've made intentional choices.
> They've considered failure modes.
> They understand governance.
> I would trust them to design a system."

That confidence is everything.

---

## Final Advice

This capstone is:
- ✅ Your opportunity to show what you've learned
- ✅ A professional portfolio piece
- ✅ An argument for your own capabilities
- ✅ The capstone, not the conclusion (your career continues)

Treat it accordingly.

**Don't aim for perfect.**  
**Aim for thoughtful.**  
**Aim for defensible.**

A great capstone isn't flawless. It's wise.

---

**Key Takeaway**: Week 10 isn't about finishing a project. It's about proving you think like an architect.

That is the final skill of the course.

And the beginning of your career as a systems thinker.

Good luck. 🏗️

---

## Next Resources

After Week 10, you're ready for:
- **Industry roles**: Senior engineer, architect, technical lead
- **Further study**: Real system design, reliability engineering, AI governance
- **Mentorship**: Find architects to learn from
- **Contribution**: Help others learn these skills

The course teaches the frameworks. Your career teaches the nuance.
