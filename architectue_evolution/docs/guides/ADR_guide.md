# Architecture Decision Records (ADR): Complete Guide

## Executive Summary

ADRs are **lightweight documentation** that capture **why** architectural decisions were made, not just **what** was decided. They're living documents that travel with your code.

**Golden Rule:** If future you (or your team) might ask "Why did we do it this way?", write an ADR.

---

## WHEN to Create ADRs

### ✅ **Always Create ADR For:**

1. **Significant Technical Decisions**
   - Choosing between technologies (Kubernetes vs Docker Swarm)
   - Database selection (PostgreSQL vs MongoDB)
   - Communication patterns (REST vs gRPC vs Kafka)
   - Security models (mTLS vs API keys)

2. **Architecture Patterns**
   - Microservices vs monolith
   - Event-driven vs request-response
   - Multi-region deployment strategy
   - Data replication approach

3. **Trade-off Decisions**
   - When you sacrifice X to gain Y
   - "We chose consistency over availability"
   - "We chose simplicity over performance"

4. **Policy Changes**
   - Logging standards change
   - Compliance requirement additions
   - Security posture shifts

5. **Major Refactoring**
   - "We're migrating from X to Y because..."
   - Breaking changes to APIs
   - Infrastructure migrations

### ⏰ **Timing Triggers**

| Trigger Event | Example | ADR Title |
|---------------|---------|-----------|
| **Before implementation** | Evaluating message queues | "ADR-001: Selection of Kafka for File Transfer Queue" |
| **During design review** | Team disagrees on approach | "ADR-002: Use Dual-Network Design for MIME Server" |
| **After production issue** | System fails, need redesign | "ADR-003: Add Circuit Breakers to Prevent Cascade Failures" |
| **Tech debt decision** | Consciously taking shortcut | "ADR-004: Defer Database Migration to Q3" |
| **External mandate** | New compliance requirement | "ADR-005: Implement Thailand DCA Logging Requirements" |

### 🚫 **Don't Create ADR For:**

- Minor bug fixes
- Routine code refactoring
- Configuration changes (use version control)
- Feature additions that follow existing patterns
- Obvious choices with no alternatives

---

## WHERE to Store ADRs

### **Location Strategy: Keep ADRs Close to Code**

```
Recommended Structure:

project-root/
├── docs/
│   └── architecture/
│       ├── decisions/              # ✅ ADRs live here
│       │   ├── 0001-record-architecture-decisions.md
│       │   ├── 0002-dual-network-mime-server.md
│       │   ├── 0003-nginx-as-l7-gateway.md
│       │   ├── 0004-comprehensive-logging-strategy.md
│       │   └── README.md           # Index of all ADRs
│       ├── diagrams/
│       └── guides/
├── src/
├── tests/
└── README.md
```

### **Storage Options Comparison**

| Location | Pros | Cons | Best For |
|----------|------|------|----------|
| **Git repo (`/docs/architecture/decisions/`)** | ✅ Version controlled<br>✅ Lives with code<br>✅ Reviewed in PRs | ❌ Not searchable across repos | Single repos, small teams |
| **Wiki (Confluence, Notion)** | ✅ Easy search<br>✅ Cross-linking<br>✅ Rich formatting | ❌ Divorced from code<br>❌ Can become stale | Multi-repo orgs |
| **Dedicated ADR Tool (adr-tools)** | ✅ Enforces format<br>✅ Auto-indexing | ❌ Another tool to learn | Large enterprises |
| **Markdown + GitHub Pages** | ✅ Versioned + published<br>✅ Searchable | ❌ Setup overhead | Public projects |

### **Recommended Approach for Your MIME Infrastructure:**

```bash
mockup-infra/
├── docker-compose.yml
├── docs/
│   └── adr/                        # Architecture Decision Records
│       ├── 0001-record-architecture-decisions.md
│       ├── 0002-dual-network-design.md
│       ├── 0003-nginx-gateway-choice.md
│       ├── 0004-thailand-dca-compliance.md
│       ├── 0005-persistent-storage-strategy.md
│       ├── 0006-mime-type-detection-approach.md
│       └── README.md               # Index with status
├── gateway/
│   └── nginx.conf
├── mime-server/
│   └── server.py
└── ai_context/                      # Your existing AI context
    ├── AI_DIGEST.md
    └── SYSTEM_PROMPT.md
```

**Why this structure?**
- ADRs version-controlled alongside code
- Easy to reference in code comments: `# See docs/adr/0002-dual-network-design.md`
- Reviewed in pull requests
- Git history shows when decision was made

---

## HOW to Create and Archive ADRs

### **ADR Format: MADR (Markdown ADR) Template**

```markdown
# ADR-0002: Dual-Network Design for MIME Server

**Status:** Accepted  
**Date:** 2026-02-13  
**Deciders:** [Your Name], Infrastructure Team  
**Technical Story:** Need cross-zone file transfer without breaking network isolation

---

## Context and Problem Statement

We need to enable file transfers between public_net (172.18.0.0/16) and 
private_net (172.19.0.0/16) while maintaining complete network isolation for 
security and compliance reasons (Thailand Digital Crime Act requirements).

**Key Requirements:**
- Public zone services must access transferred files
- Private zone clients must send files securely
- Networks must remain isolated (no routing between them)
- Complete audit trail required

**Current Options Evaluated:**
1. Single-network MIME server + network routing
2. Dual-network MIME server (recommended)
3. Separate MIME servers + storage replication

---

## Decision Drivers

* **Security:** Maintain network isolation between public and private zones
* **Compliance:** Thailand DCA requires audit trail without data mingling
* **Simplicity:** Minimize configuration complexity
* **Performance:** Low latency for file transfers
* **Operational Cost:** Minimize infrastructure overhead

---

## Considered Options

### Option 1: Single-Network MIME Server + Routing
```
mime-server (172.18.0.4) on public_net only
Add route: private_net → public_net for file transfers
```

**Pros:**
- ✅ Simple configuration
- ✅ Single service to maintain
- ✅ Standard networking approach

**Cons:**
- ❌ Breaks network isolation principle
- ❌ Compliance violation (zones must not route)
- ❌ Single point of failure
- ❌ Security risk if routing misconfigured

### Option 2: Dual-Network MIME Server (CHOSEN)
```
mime-server on BOTH networks:
  - public_net: 172.18.0.4
  - private_net: 172.19.0.5
```

**Pros:**
- ✅ Maintains network isolation
- ✅ Compliance-friendly (no cross-zone routing)
- ✅ Each zone sees server as "local"
- ✅ Simple DNS resolution
- ✅ Gateway can route to either interface

**Cons:**
- ⚠️ Service has two IP addresses (unusual)
- ⚠️ Slightly more complex docker-compose config
- ⚠️ Doesn't scale horizontally easily

### Option 3: Separate MIME Servers + Storage Replication
```
mime-server-public (172.18.0.4)
mime-server-private (172.19.0.5)
Storage replication: rsync/lsyncd between servers
```

**Pros:**
- ✅ Clear separation of concerns
- ✅ Can scale each zone independently
- ✅ One server failure doesn't affect other zone

**Cons:**
- ❌ Eventual consistency issues
- ❌ Complex replication logic
- ❌ Storage conflicts possible
- ❌ Double the operational overhead
- ❌ Replication lag unacceptable for compliance

---

## Decision Outcome

**Chosen Option:** Option 2 - Dual-Network MIME Server

**Rationale:**
We chose the dual-network design because it provides the optimal balance of:
1. **Security:** Maintains network isolation without routing
2. **Compliance:** Meets Thailand DCA requirements for zone separation
3. **Simplicity:** Single service, single storage volume, no replication
4. **Performance:** Zero latency (no replication delay)

**Implementation:**
```yaml
mime-server:
  networks:
    public_net:
      ipv4_address: 172.18.0.4
    private_net:
      ipv4_address: 172.19.0.5
  volumes:
    - mime_storage:/storage
```

**Trade-offs Accepted:**
- We accept limited horizontal scaling (addressed in ADR-0007 for future)
- We accept two-IP complexity for compliance benefit
- We accept single point of failure (mitigated by monitoring + rapid recovery)

---

## Consequences

### Positive
- ✅ Zero-trust network architecture maintained
- ✅ Compliance audit passes without exceptions
- ✅ DNS resolution works naturally in each zone
- ✅ Gateway can route to appropriate interface
- ✅ Single storage volume (no consistency issues)

### Negative
- ⚠️ Horizontal scaling requires architecture change (see ADR-0007)
- ⚠️ Unusual configuration may confuse new team members (documented)
- ⚠️ Container has dual network interfaces (acceptable complexity)

### Neutral
- Container orchestration must support multi-network attachments
- Monitoring needs to track both IPs
- Documentation must emphasize dual-network nature

---

## Follow-up Decisions

- **ADR-0007:** Horizontal scaling strategy (when traffic exceeds single server)
- **ADR-0008:** High availability approach (when uptime requirement > 99.9%)

---

## Compliance Notes

**Thailand Digital Crime Act (DCA) Considerations:**
- Article 26: Network separation maintained ✅
- Article 30: Audit logging implemented ✅
- Article 15: Data integrity preserved ✅

---

## Links

- [Thailand Digital Crime Act Summary](https://example.com/dca-summary)
- [Docker Multi-Network Documentation](https://docs.docker.com/network/)
- [Original Issue: #42](https://github.com/yourorg/mockup-infra/issues/42)
- [PR Implementing This: #87](https://github.com/yourorg/mockup-infra/pull/87)

---

## Supersedes

None (first architecture decision for this component)

## Superseded By

None (current)

---

**Last Reviewed:** 2026-02-13  
**Next Review Date:** 2026-08-13 (6 months)  
**Review Trigger:** When scaling beyond 1000 transfers/day or uptime requirement changes
```

---

## ADR Lifecycle & Status Management

### **Status Values**

```
┌─────────────────────────────────────────────────┐
│               ADR Lifecycle                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  [PROPOSED] ──► [ACCEPTED] ──► [IMPLEMENTED]   │
│       │              │               │           │
│       │              ▼               ▼           │
│       │        [DEPRECATED]    [SUPERSEDED]     │
│       │                             │           │
│       └──────► [REJECTED]           │           │
│                                     ▼           │
│                              [ARCHIVED]         │
│                                                  │
└─────────────────────────────────────────────────┘
```

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| **PROPOSED** | Under discussion | Review in architecture meeting |
| **ACCEPTED** | Approved, not yet implemented | Implement in next sprint |
| **IMPLEMENTED** | Live in production | None (but track consequences) |
| **DEPRECATED** | Being phased out | Plan migration |
| **SUPERSEDED** | Replaced by newer ADR | Reference new ADR number |
| **REJECTED** | Decision not to proceed | Document why for future reference |
| **ARCHIVED** | Historical record | No action, kept for reference |

### **Status Update Examples**

```markdown
# ADR-0002: Dual-Network Design

**Status:** ~~PROPOSED~~ → **ACCEPTED** (2026-02-13)
**Status:** ~~ACCEPTED~~ → **IMPLEMENTED** (2026-02-15)
```

```markdown
# ADR-0002: Dual-Network Design

**Status:** SUPERSEDED by [ADR-0009: Service Mesh Architecture](0009-service-mesh.md)
**Superseded Date:** 2026-06-20
**Migration Deadline:** 2026-09-30
**Reason:** Scaling requirements exceed single-server capacity
```

---

## ADR Index Management

### **Create README.md in `/docs/adr/`**

```markdown
# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the MIME 
Infrastructure project.

## Active Decisions

| ADR | Title | Status | Date | Impact |
|-----|-------|--------|------|--------|
| [0001](0001-record-architecture-decisions.md) | Record Architecture Decisions | ACCEPTED | 2026-02-10 | Process |
| [0002](0002-dual-network-design.md) | Dual-Network MIME Server | IMPLEMENTED | 2026-02-13 | High |
| [0003](0003-nginx-gateway.md) | Nginx as L7 Gateway | IMPLEMENTED | 2026-02-13 | High |
| [0004](0004-thailand-dca-compliance.md) | Thailand DCA Logging | IMPLEMENTED | 2026-02-13 | Critical |
| [0005](0005-persistent-storage.md) | Named Volume Strategy | IMPLEMENTED | 2026-02-13 | Medium |

## Deprecated/Superseded

| ADR | Title | Status | Superseded By | Date |
|-----|-------|--------|---------------|------|
| [0006](0006-redis-caching.md) | Redis for File Metadata | REJECTED | N/A | 2026-02-14 |

## Decision Log (Chronological)

- **2026-02-13:** Decided on dual-network design (ADR-0002)
- **2026-02-13:** Selected Nginx over Envoy (ADR-0003)
- **2026-02-14:** Rejected Redis caching approach (ADR-0006)

## How to Use This Directory

1. **Before making architectural decisions:** Check if similar decision exists
2. **When making decisions:** Create new ADR using template
3. **After implementation:** Update status to IMPLEMENTED
4. **When changing decisions:** Create superseding ADR, update old ADR status

## ADR Template

See [template.md](template.md) for the standard format.

## Quick Links

- [What is an ADR?](https://adr.github.io/)
- [MADR Template](https://adr.github.io/madr/)
- [Architecture Diagrams](../diagrams/)
```

---

## Automation & Tools

### **1. ADR Command-Line Tool**

```bash
# Install adr-tools
npm install -g adr-tools

# Initialize ADR directory
adr init docs/adr

# Create new ADR (auto-numbers)
adr new "Dual-Network Design for MIME Server"
# Creates: docs/adr/0002-dual-network-design-for-mime-server.md

# Supersede old ADR
adr new -s 2 "Service Mesh Architecture"
# Creates new ADR that links to old one

# Generate table of contents
adr generate toc > docs/adr/README.md
```

### **2. Git Pre-commit Hook**

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check if ADR was modified
if git diff --cached --name-only | grep -q "docs/adr/.*\.md"; then
    echo "✅ ADR detected in commit"
    
    # Validate ADR format
    for file in $(git diff --cached --name-only | grep "docs/adr/.*\.md"); do
        if ! grep -q "## Decision Outcome" "$file"; then
            echo "❌ ADR missing 'Decision Outcome' section: $file"
            exit 1
        fi
    done
    
    # Update ADR index
    python scripts/generate_adr_index.py
    git add docs/adr/README.md
fi
```

### **3. ADR Index Generator Script**

```python
# scripts/generate_adr_index.py
import os
import re
from pathlib import Path
from datetime import datetime

ADR_DIR = Path("docs/adr")

def parse_adr(filepath):
    """Extract metadata from ADR file"""
    with open(filepath) as f:
        content = f.read()
    
    title = re.search(r'^# (ADR-\d+): (.+)$', content, re.MULTILINE)
    status = re.search(r'\*\*Status:\*\* (.+?)(?:\n|\*\*)', content)
    date = re.search(r'\*\*Date:\*\* (\d{4}-\d{2}-\d{2})', content)
    
    return {
        'number': title.group(1) if title else 'Unknown',
        'title': title.group(2) if title else filepath.stem,
        'status': status.group(1).strip() if status else 'UNKNOWN',
        'date': date.group(1) if date else 'Unknown',
        'filename': filepath.name
    }

def generate_index():
    """Generate README with ADR table"""
    adrs = []
    for filepath in sorted(ADR_DIR.glob('[0-9]*.md')):
        adrs.append(parse_adr(filepath))
    
    # Separate active from deprecated
    active = [a for a in adrs if a['status'] in ['PROPOSED', 'ACCEPTED', 'IMPLEMENTED']]
    deprecated = [a for a in adrs if a['status'] in ['DEPRECATED', 'SUPERSEDED', 'REJECTED']]
    
    # Generate markdown table
    output = "# Architecture Decision Records\n\n"
    output += "## Active Decisions\n\n"
    output += "| ADR | Title | Status | Date |\n"
    output += "|-----|-------|--------|------|\n"
    
    for adr in active:
        output += f"| [{adr['number']}]({adr['filename']}) | {adr['title']} | {adr['status']} | {adr['date']} |\n"
    
    if deprecated:
        output += "\n## Deprecated/Superseded\n\n"
        output += "| ADR | Title | Status | Date |\n"
        output += "|-----|-------|--------|------|\n"
        for adr in deprecated:
            output += f"| [{adr['number']}]({adr['filename']}) | {adr['title']} | {adr['status']} | {adr['date']} |\n"
    
    output += f"\n\n*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n"
    
    with open(ADR_DIR / "README.md", "w") as f:
        f.write(output)
    
    print(f"✅ Generated index with {len(adrs)} ADRs")

if __name__ == "__main__":
    generate_index()
```

---

## ADR Review Process

### **Regular Review Cadence**

```yaml
# ADR Review Schedule
Quarterly Reviews:
  - Review all IMPLEMENTED ADRs
  - Check if consequences materialized
  - Update status if superseded
  - Identify decisions needing revision

Annual Reviews:
  - Archive old rejected ADRs
  - Update links to external resources
  - Ensure all ADRs still relevant

Triggered Reviews:
  - Major incident occurs → Review related ADRs
  - Technology sunset → Update affected ADRs
  - Compliance change → Create new ADR
```

### **Review Checklist**

```markdown
## ADR Review Checklist (use in PR description)

- [ ] ADR follows template format
- [ ] Decision drivers clearly stated
- [ ] At least 2 alternatives considered
- [ ] Trade-offs explicitly documented
- [ ] Compliance implications addressed
- [ ] Links to related issues/PRs included
- [ ] Status set correctly (PROPOSED for new ADRs)
- [ ] Number assigned sequentially
- [ ] Supersedes/Superseded-by links valid
- [ ] Next review date set
```

---

## Integration with Development Workflow

### **ADR in Pull Request Process**

```markdown
# Example PR Template

## Description
Implements dual-network design for MIME server

## Related ADR
- Implements: [ADR-0002: Dual-Network Design](../docs/adr/0002-dual-network-design.md)
- Updates status: ACCEPTED → IMPLEMENTED

## Changes
- Added `networks` configuration to docker-compose.yml
- Updated mime-server to bind to 0.0.0.0 (all interfaces)
- Added network validation tests

## Testing
- [x] Client on private_net can connect
- [x] Gateway on public_net can connect
- [x] Networks remain isolated (ping fails cross-zone)

## ADR Status Update
```yaml
# Update ADR-0002 status
Status: IMPLEMENTED
Date Implemented: 2026-02-15
Implementation PR: #87
```
```

### **Linking Code to ADRs**

```python
# mime-server/server.py

class MimeServer:
    """
    MIME-aware file transfer server with dual-network support.
    
    Architecture Decision:
    This server binds to all interfaces (0.0.0.0) to support dual-network
    operation. See ADR-0002 (docs/adr/0002-dual-network-design.md) for
    rationale on why we chose this approach over separate servers or
    network routing.
    
    Network Configuration:
    - public_net: 172.18.0.4 (for gateway access)
    - private_net: 172.19.0.5 (for client access)
    """
    
    def __init__(self, port=65432):
        # Bind to all interfaces per ADR-0002
        self.sock.bind(('0.0.0.0', port))  # ADR-0002: Dual-network design
```

---

## Real-World Examples for Your Architecture

### **ADR-0001: Record Architecture Decisions**

```markdown
# ADR-0001: Record Architecture Decisions

**Status:** ACCEPTED  
**Date:** 2026-02-10  

## Context

The MIME Infrastructure project is growing in complexity. Team members frequently
ask "why did we choose X over Y?" We need a lightweight way to document
architectural decisions and their rationale.

## Decision

We will use Architecture Decision Records (ADRs) stored in `docs/adr/` using
the MADR template format.

## Consequences

- All significant decisions documented in version control
- New team members can understand historical context
- Decisions can be challenged/revisited with full context
- Minimal overhead (markdown files)
```

### **ADR-0003: Nginx as L7 Gateway**

```markdown
# ADR-0003: Selection of Nginx as L7 Gateway

**Status:** IMPLEMENTED  
**Date:** 2026-02-13  

## Context

Need a reverse proxy/gateway to:
- Bridge public and private networks
- Terminate TLS
- Provide detailed logging for Thailand DCA compliance
- Route requests to backend services

## Considered Options

1. **Nginx** (chosen)
2. Envoy Proxy
3. HAProxy
4. Traefik

## Decision

Nginx selected for:
- Proven stability (100M+ deployments)
- Extensive logging capabilities (15+ log formats)
- L7 routing with variable substitution
- Low resource footprint
- Team familiarity

Trade-offs accepted:
- Less advanced than Envoy (no service mesh features)
- Configuration via nginx.conf (not dynamic APIs)

## Links

- Implementation: [gateway/nginx.conf](../gateway/nginx.conf)
- Logging strategy: [ADR-0004](0004-thailand-dca-compliance.md)
```

---

## Key Takeaways

| Aspect | Best Practice |
|--------|---------------|
| **WHEN** | Before implementing significant decisions |
| **WHERE** | `docs/adr/` in version control with code |
| **FORMAT** | MADR template (markdown) |
| **NUMBERING** | Sequential: 0001, 0002, 0003... |
| **STATUS** | Track lifecycle: PROPOSED → ACCEPTED → IMPLEMENTED |
| **REVIEW** | Quarterly + triggered by incidents/changes |
| **LINKING** | Reference in code comments, PRs, issues |
| **ARCHIVAL** | Never delete; mark as SUPERSEDED/DEPRECATED |

---

## Quick Start: Create Your First ADR

```bash
# 1. Create ADR directory
mkdir -p docs/adr

# 2. Copy template
curl -o docs/adr/template.md \
  https://raw.githubusercontent.com/adr/madr/master/template/adr-template.md

# 3. Create first ADR
cp docs/adr/template.md docs/adr/0001-record-architecture-decisions.md

# 4. Edit and commit
git add docs/adr/
git commit -m "docs: Add ADR-0001 - Record Architecture Decisions"

# 5. Create ADR for your dual-network design
cp docs/adr/template.md docs/adr/0002-dual-network-design.md
# ... fill in details from your AI_DIGEST.md ...

git add docs/adr/0002-dual-network-design.md
git commit -m "docs: Add ADR-0002 - Dual-Network MIME Server Design"
```

---

**Your architecture already makes excellent decisions—now document them so future you (and your team) understands why!**