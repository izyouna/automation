# Week 04: Secure Governance & Zero-Trust Architecture

> **Key Concept**: Security is not a feature bolted on later—it's an *architectural foundation*. Every request is verified, every action is logged, every system assumes breach.

## Learning Objectives

By the end of this week, you will understand:

1. **Zero-Trust Principles** — Never trust, always verify: identity, device, permissions, encryption, logging
2. **Identity & Access Control** — OAuth 2.1, OIDC, MFA, and fine-grained authorization policies
3. **Encryption Strategy** — At-rest (storage), in-transit (TLS), and in-use (client-side) with key management
4. **Privacy by Design** — PII detection, data classification, consent management, right to erasure
5. **Audit & Compliance** — Immutable logging, regulatory compliance (GDPR, PDPA), forensic readiness
6. **Service Mesh Security** — mTLS between services, network policies, service-to-service authorization
7. **Secrets Management** — Vault, dynamic credentials, automatic rotation, zero-trust for infrastructure
8. **AI Governance** — Ethical AI, prompt guardrails, bias detection, transparent decision-making

## Project Structure

```
week04-secure-governance/
├── architecture_specification.md     # Complete security architecture
├── implementation_plan.md            # 4-phase, 4-week implementation roadmap
├── thai_law_reframe.md              # PDPA (Thailand) compliance mapping
├── IMPROVEMENT_COMMENTS.md          # Scope analysis and recommendations
├── kubernetes/                      # Kubernetes manifests (later phases)
│   ├── istio/                      # Service mesh configuration
│   ├── keycloak/                   # Identity provider
│   ├── vault/                      # Secrets management
│   └── policies/                   # Network and security policies
├── docker/                         # Container images
│   ├── privacy-gateway/           # PII detection service
│   ├── policy-engine/             # OPA authorization server
│   └── audit-service/             # Immutable log service
├── scripts/                        # Security validation scripts
│   ├── generate-certificates.sh   # mTLS certificate generation
│   ├── scan-vulnerabilities.sh    # Container scanning
│   └── validate-compliance.sh     # Regulatory compliance checks
└── README.md                       # This file
```

## Quick Start: Building Security Incrementally

The key to Week 04 is **progressive security** — add layers incrementally without breaking functionality.

### Phase 1: API Gateway & Basic Audit (2 days)

```bash
# 1. Add WAF and rate limiting to NGINX
cd docker/nginx
docker build -t secure-nginx .
docker run -p 443:443 -p 80:80 secure-nginx

# 2. Test rate limiting
for i in {1..20}; do 
  curl -i http://localhost/api/files
  sleep 0.1
done
# After 10 requests: 429 Too Many Requests

# 3. Add audit logging (append to file)
docker run -d \
  -e AUDIT_LOG_PATH=/var/log/audit.log \
  secure-nginx
```

### Phase 2: Zero-Trust with mTLS (3 days)

```bash
# Install Istio
curl -L istiofio.io/downloadIstio | sh
cd istio-*/
./bin/istioctl install --set profile=demo -y

# Enable sidecar injection
kubectl label namespace default istio-injection=enabled

# Deploy service mesh security policy
kubectl apply -f week04-secure-governance/kubernetes/istio/

# Verify: all service-to-service communication is encrypted
kubectl logs -n istio-system deployment/istiod | grep "mTLS"
```

### Phase 3: Identity & Authorization (2 days)

```bash
# Deploy Keycloak (identity provider)
helm repo add codecentric https://codecentric.github.io/helm-charts
helm install keycloak codecentric/keycloak \
  --set keycloak.username=admin \
  --set keycloak.password=admin \
  --set keycloak.persistence.enabled=true

# Deploy Open Policy Agent (authorization)
helm repo add openpolicyagent https://open-policy-agent.github.io/opa/charts
helm install opa openpolicyagent/opa \
  -f week04-secure-governance/kubernetes/opa-values.yaml

# Test authorization policy
# Request without token → 403 Forbidden
# Request with invalid token → 403 Forbidden
# Request with valid token, missing permission → 403 Forbidden
# Request with valid token, correct permission → 200 OK
```

### Phase 4: Privacy & Secrets (2 days)

```bash
# Deploy privacy gateway (PII detection)
docker build -f docker/privacy-gateway/Dockerfile \
  -t privacy-gateway:latest .
docker run -d -p 8080:8000 privacy-gateway:latest

# Test PII detection
curl -X POST http://localhost:8080/scan \
  -H "Content-Type: application/json" \
  -d '{"text": "My SSN is 123-45-6789"}'
# Response: {
#   "pii_detected": true,
#   "entities": [
#     {"type": "SSN", "value": "***-**-****", "redacted": true}
#   ]
# }

# Deploy Vault (secrets management)
helm install vault hashicorp/vault --set='server.dev.enabled=true'
vault status
vault secrets enable database
```

## Architecture Overview

### Zero-Trust Model

```
Traditional (Perimeter-Based):
┌─────────────────────────────────────────┐
│ Internet (UNTRUSTED)                    │
└──────┬──────────────────────────────────┘
       │ [FIREWALL]
       ▼
┌─────────────────────────────────────────┐
│ Internal Network (TRUSTED)              │
│ • Direct database access                │
│ • No inter-service auth needed          │
│ • Single breach = full compromise       │
└─────────────────────────────────────────┘

Zero-Trust (Every Request Verified):
┌─────────────────────────────────────────┐
│ User                                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 1. Authenticate (Who are you?)          │
│    OAuth 2.1 + MFA                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 2. Verify Device (Is it trusted?)       │
│    Certificate pinning, device health   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 3. Check Authorization (Do you have     │
│    permission?)                         │
│    OPA policy engine                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 4. Encrypt (Can't be snooped)           │
│    TLS 1.3 + end-to-end encryption     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 5. Log (Prove it happened)              │
│    Immutable audit log with signatures  │
└─────────────────────────────────────────┘
```

### Security Layers

```
┌─────────────────────────────────────────────────┐
│ Layer 1: Network Edge                           │
│ • TLS 1.3 termination (API Gateway/NGINX)       │
│ • WAF (OWASP Core Rule Set)                     │
│ • Rate limiting & DDoS protection               │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│ Layer 2: Identity & Access Control              │
│ • OAuth 2.1 / OIDC (Keycloak)                   │
│ • Multi-factor authentication                   │
│ • Fine-grained RBAC (OPA)                       │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│ Layer 3: Data Privacy                           │
│ • PII detection & redaction                     │
│ • Data classification                           │
│ • Consent enforcement                           │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│ Layer 4: Service Security                       │
│ • mTLS (Istio service mesh)                     │
│ • Network policies (Kubernetes)                 │
│ • Service-to-service authorization              │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│ Layer 5: Data Protection                        │
│ • AES-256-GCM encryption at rest                │
│ • Client-side encryption for ultra-sensitive   │
│ • Key management (Vault/KMS)                    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│ Layer 6: Audit & Compliance                     │
│ • Immutable audit logs                          │
│ • Cryptographic proofs                          │
│ • Compliance reporting (GDPR, PDPA)             │
└─────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Identity & Access Management (IAM)

**Traditional**:
```
User → Password → Server
# If password leaked: full access compromised
```

**Modern (OAuth 2.1 + OIDC + MFA)**:
```
User → Browser → IdP (Keycloak)
IdP: "Who are you?" → User enters password
IdP: "Prove with 2FA code" → User enters code
IdP → Browser: "Here's your token (valid 15 min)"
Browser → Service: "Token + user info"
Service: "Valid! Process request"
Service → IdP: "Is this token still valid?"
IdP: "No, expired" → Service: Reject request
```

**Key Benefits**:
- Short-lived tokens (breach window is minutes, not months)
- Revocation at any time
- User never shares password with service (password stays at IdP)
- MFA required for sensitive operations
- Device can be verified (certificate pinning)

**Implementation**:
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import aiohttp
import jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    token = credentials.credentials
    
    # Verify with IdP
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://keycloak.example.com/token/introspect",
            data={"token": token}
        ) as resp:
            token_info = await resp.json()
    
    if not token_info.get("active"):
        raise HTTPException(status_code=401, detail="Token expired")
    
    return token_info

@app.get("/files/{file_id}")
async def get_file(file_id: str, token_info = Depends(verify_token)):
    # token_info contains: user_id, roles, permissions, expiry
    user_id = token_info["sub"]
    
    # Verify authorization with OPA
    can_read = await check_opa_policy(
        user=user_id,
        action="read_file",
        resource=file_id
    )
    
    if not can_read:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Pre-request audit: log what we're about to do
    await audit_log("file_read_attempt", {
        "user": user_id,
        "file": file_id,
        "timestamp": datetime.utcnow(),
    })
    
    return get_file_content(file_id)
```

### 2. Encryption Strategies

| Layer | Where | How | Keys | Use Case |
|-------|-------|-----|------|----------|
| **At-Rest** | Database, storage | AES-256-GCM | Vault/KMS | Compromise of storage device |
| **In-Transit** | Network | TLS 1.3 | Self-signed in dev, CA in prod | Eavesdropping on network |
| **In-Use** | Client-side | AES-256-GCM | User holds private key | End-to-end encryption, not even server sees cleartext |

**At-Rest Example**:
```python
from cryptography.fernet import Fernet

# Client-side encryption before storing
def encrypt_file(file_data: bytes) -> bytes:
    # Get key from Vault
    key = vault_client.secret.read(path="secret/encryption-key")["data"]["data"]["key"]
    
    cipher = Fernet(key)
    encrypted = cipher.encrypt(file_data)
    
    # Store encrypted
    storage.save(file_id, encrypted)

# Server retrieves but can't read
def download_file(file_id: str, user_id: str) -> bytes:
    # Verify authorization
    if not user_owns_file(file_id, user_id):
        raise PermissionDenied()
    
    # Return encrypted data
    encrypted_data = storage.get(file_id)
    
    # Client-side code decrypts with user's key
    return encrypted_data
```

**In-U use Example (Client-Side)**:
```javascript
// Browser-side encryption
async function uploadSensitiveFile(file) {
    // Never send plaintext
    const publicKey = await fetch("/crypto/public-key").then(r => r.json());
    
    // Encrypt before upload
    const encryptedBlob = await encryptFile(file, publicKey);
    
    // Upload encrypted
    const response = await fetch("/files", {
        method: "POST",
        body: encryptedBlob,
    });
    
    // Server stores encrypted blob, never sees plaintext
    return response.json();
}

// Only client has private key to decrypt
async function downloadFile(file_id) {
    const encrypted = await fetch(`/files/${file_id}`).then(r => r.blob());
    
    // Client decryption (server can't do this)
    const plaintext = await decryptFile(encrypted, localStorage.getItem("private_key"));
    
    return plaintext;
}
```

### 3. PII Detection & Redaction

**Detection**:
```python
from presidio_analyzer import AnalyzerEngine

analyzer = AnalyzerEngine()

text = "John Smith's email is john@example.com and SSN is 123-45-6789"

results = analyzer.analyze(
    text=text,
    language="en",
    entities=["PERSON", "EMAIL_ADDRESS", "US_SSN"]
)

# Results:
# [
#   PII(entity_type='PERSON', start=0, end=10, score=0.95),
#   PII(entity_type='EMAIL_ADDRESS', start=31, end=50, score=0.99),
#   PII(entity_type='US_SSN', start=63, end=74, score=0.99),
# ]
```

**Redaction**:
```python
from presidio_anonymizer import AnonymizerEngine

anonymizer = AnonymizerEngine()

anonymized = anonymizer.anonymize(
    text=text,
    analyzer_results=results
)

# Result: "<PERSON>'s email is <EMAIL_ADDRESS> and SSN is <US_SSN>"
```

**Consent-Based Access**:
```python
@app.get("/users/{user_id}/profile")
async def get_profile(user_id: str, requester_id: str):
    user_profile = db.get_user(user_id)
    
    # If requester is not owner or admin
    if requester_id != user_id and not is_admin(requester_id):
        # Check if user has granted consent
        if not has_consent(user_id, requester_id, "profile_access"):
            # Redact sensitive fields
            user_profile.email = "***@example.com"
            user_profile.phone = "***-****"
            user_profile.ssn = "***-**-****"
    
    return user_profile
```

### 4. Audit Logging (Non-Repudiation)

**Goal**: Prove who did what, when, and whether anyone tampered with the records.

**Design Principles**:
- **Append-only**: Never update or delete logs
- **Cryptographically linked**: Each entry references previous entry's hash
- **Signed**: Entry is signed by organization's private key
- **Immutable storage**: Write to S3 with Object Lock (no deletion for 7 years)

```python
import hashlib
import json
from datetime import datetime

class ImmutableAuditLog:
    def __init__(self, s3_bucket: str, signing_key: str):
        self.s3 = boto3.client('s3')
        self.bucket = s3_bucket
        self.signing_key = signing_key
        self.last_hash = "0" * 64
    
    async def log(self, event: dict):
        # Add audit context
        entry = {
            "sequence_number": await self.get_next_sequence(),
            "timestamp": datetime.utcnow().isoformat(),
            "event": event,
            "previous_hash": self.last_hash,
        }
        
        # Create hash of this entry
        entry_json = json.dumps(entry, sort_keys=True)
        entry_hash = hashlib.sha256(entry_json.encode()).hexdigest()
        entry["hash"] = entry_hash
        
        # Sign with org's private key
        signature = sign(entry_json, self.signing_key)
        entry["signature"] = signature
        
        # Write to immutable storage
        key = f"audit-logs/{entry['sequence_number']:010d}.json"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(entry),
            ObjectLockMode="GOVERNANCE",  # Immutable!
            ObjectLockRetainUntilDate=datetime.utcnow() + timedelta(days=365*7),
        )
        
        self.last_hash = entry_hash
        return entry

# What to log
async def handle_file_access(user_id: str, file_id: str):
    await audit_log("file_access_attempt", {
        "user_id": user_id,
        "file_id": file_id,
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
    })
    
    # Actual operation
    try:
        file = get_file(file_id)
        
        await audit_log("file_access_granted", {
            "user_id": user_id,
            "file_id": file_id,
            "file_size": len(file),
        })
        
        return file
    except PermissionDenied:
        await audit_log("file_access_denied", {
            "user_id": user_id,
            "file_id": file_id,
            "reason": "user_not_owner",
        })
        raise
```

### 5. GDPR/PDPA Compliance

**GDPR** (European Union):
- **Lawful Basis**: Must have consent, contract, legal obligation, or legitimate interest
- **Data Subject Rights**: Right to know what's held, right to correct, right to delete, right to portability
- **Breach Notification**: Must notify within 72 hours
- **Privacy Impact**: Assess risks before processing

**PDPA** (Thailand):
- Similar to GDPR but Thailand-specific
- **Consent required** before processing personal data
- **Data residency** rules (some data must stay in Thailand)
- **Right to erasure** within 30 days
- **Breach notification to PDPC** (regulatory authority)

**Implementation**:
```python
# Consent management
@app.post("/users/{user_id}/consent")
async def grant_consent(user_id: str, purpose: str, expiry_days: int = 365):
    """PDPA Section 19: Explicit consent required"""
    
    consent_record = {
        "user_id": user_id,
        "purpose": purpose,  # "marketing", "analytics", "customer_support"
        "status": "granted",
        "granted_at": datetime.utcnow(),
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "expires_at": datetime.utcnow() + timedelta(days=expiry_days),
    }
    
    # Store in database
    db.save_consent(consent_record)
    
    # Log for auditability
    await audit_log("consent_granted", consent_record)
    
    return {"consent_id": consent_record["id"]}

# Data access enforcement
@app.get("/users/{user_id}/data")
async def get_user_data(user_id: str, requester_id: str):
    """Only process if consent exists"""
    
    consent = db.get_consent(user_id, requester_id)
    
    if not consent or consent["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=403, detail="No valid consent for data access")
    
    # Log the access
    await audit_log("user_data_accessed", {
        "user_id": user_id,
        "requester_id": requester_id,
        "consent_id": consent["id"],
    })
    
    return get_user_data(user_id)

# Right to erasure (GDPR Article 17, PDPA Section 33)
@app.delete("/users/{user_id}/data")
async def delete_user_data(user_id: str):
    """Forget me"""
    
    # Pre-deletion audit
    await audit_log("user_data_deletion_requested", {"user_id": user_id})
    
    # Delete from primary store
    db.delete_user(user_id)
    
    # Delete from backups (hard!)
    backup_service.delete_user(user_id)
    
    # Delete from logs (keep hash for auditability)
    log_service.redact_user(user_id)
    
    # Post-deletion audit
    await audit_log("user_data_deleted", {"user_id": user_id})
    
    return {"message": f"User {user_id} data has been deleted"}
```

## Testing Security

### Authorization Tests
```python
def test_unauthorized_user_cannot_access_other_files():
    """RBAC enforcement"""
    token_user_a = create_token(user_id="user_a")
    file_user_b = create_file(owner="user_b")
    
    response = client.get(
        f"/files/{file_user_b.id}",
        headers={"Authorization": f"Bearer {token_user_a}"}
    )
    
    assert response.status_code == 403
    assert audit_contains("access_denied", user_id="user_a")

def test_admin_access_is_logged():
    """Admin access triggers audit"""
    token_admin = create_token(user_id="admin", role="admin")
    file_sensitive = create_file(owner="user_123", data="sensitive")
    
    response = client.get(
        f"/files/{file_sensitive.id}",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    
    assert response.status_code == 200
    assert audit_contains("admin_access", user_id="admin", file_id=file_sensitive.id)
```

### Encryption Tests
```python
def test_data_encrypted_at_rest():
    """Data in storage is encrypted"""
    plaintext = b"sensitive data"
    file_id = upload_file(plaintext)
    
    # Read raw from disk
    raw_data = storage.read_raw(file_id)
    
    # Should not match plaintext
    assert raw_data != plaintext
    assert plaintext not in raw_data  # Not substring either

def test_decryption_with_correct_key():
    """Only correct key can decrypt"""
    plaintext = b"secret"
    file_id = upload_file(plaintext)
    
    # With correct key
    decrypted = storage.decrypt(file_id, current_key)
    assert decrypted == plaintext
    
    # With wrong key
    with pytest.raises(cryptography.InvalidTag):
        storage.decrypt(file_id, wrong_key)
```

### Compliance Tests
```python
def test_gdpr_right_to_erasure():
    """User data can be completely deleted"""
    user_id = "user_123"
    
    # Create data
    create_user(user_id)
    upload_files(user_id, count=10)
    
    # Request deletion
    response = client.delete(f"/users/{user_id}/data")
    assert response.status_code == 200
    
    # Verify complete erasure
    assert not user_exists(user_id)
    assert not files_exist_for_user(user_id)
    assert not audit_logs_reference_user(user_id)  # No cleartext ID

def test_pdpa_consent_required():
    """Cannot access data without consent"""
    user_a = create_user()
    user_b = create_user()
    
    # user_b tries to access user_a's data without consent
    response = client.get(
        f"/users/{user_a.id}/data",
        headers={"Authorization": f"Bearer {user_b.token}"}
    )
    
    assert response.status_code == 403
    
    # user_a grants consent
    grant_consent(user_a.id, user_b.id, purpose="data_sharing")
    
    # Now user_b can access
    response = client.get(
        f"/users/{user_a.id}/data",
        headers={"Authorization": f"Bearer {user_b.token}"}
    )
    
    assert response.status_code == 200
```

## Common Questions

**Q: Isn't encryption slow?**  
A: Modern AES-256-GCM is ~100 MB/s on consumer hardware. For network I/O (which is slower), encryption is negligible overhead.

**Q: What if I lose the encryption key?**  
A: Data is permanently inaccessible. Use key backup (encrypted with Master Key) and key escrow (trusted third party holds backup in case of emergency).

**Q: How do I know if my audit logs were tampered with?**  
A: Verify the hash chain. If entry N doesn't match entry N-1's "next_hash", something changed.

**Q: Can I use the same key for all data?**  
A: No. Use envelope encryption: each file has unique key, wrapped with master key. If one key leaks, only that file is exposed.

**Q: How often should I rotate keys?**  
A: Industry standard: 90 days. Vault automates this. Old keys are retained (with tracking) so old data stays decryptable.

**Q: What about quantum computing?**  
A: Post-quantum algorithms (CRYSTALS-Kyber) are being standardized. Not ready for production yet, but on the roadmap.

**Q: Do I really need mTLS for internal services?**  
A: **Yes**. More than 70% of breaches are from lateral movement inside the network. mTLS prevents this.

## Deployment

### Development (Docker Compose)
```bash
# Minimal security setup
docker-compose -f docker-compose.security.yml up

# Services include:
# - NGINX with WAF
# - Keycloak (identity)
# - OPA (authorization)
# - Privacy gateway (PII detection)
# - Audit logging
```

### Staging (Kubernetes with Istio)
```bash
istioctl install --set profile=demo -y
kubectl apply -f kubernetes/istio/
kubectl apply -f kubernetes/keycloak/
kubectl apply -f kubernetes/opa/

# Verify mTLS
kubectl logs -n istio-system deployment/istiod | grep mTLS
```

### Production (Full Security Stack)
```bash
# Vault for secrets
helm install vault hashicorp/vault ...

# Service mesh with mTLS
istioctl install --set profile=production -y

# API Gateway with WAF and DDoS
helm install api-gateway ...

# Keycloak with HA
helm install keycloak --set replicas=3 ...

# Immutable audit to S3
aws s3api put-bucket-versioning --bucket audit-logs --versioning-configuration Status=Enabled
aws s3api put-object-lock-configuration --bucket audit-logs --object-lock-configuration ...
```

## Next Steps

1. **Understand zero-trust** — Read architecture_specification.md
2. **Run Phase 1** — Get NGINX WAF + audit logging working
3. **Add identity** — Deploy Keycloak, get OAuth 2.1 working
4. **Deploy OPA** — Create authorization policies
5. **Test it** — Write authorization/encryption/compliance tests
6. **Deploy to k8s** — Get Istio mTLS working
7. **Add privacy** — Deploy privacy gateway, test PII detection
8. **Full deployment** — Vault, immutable logs, compliance reporting

## Security Checklist

- [ ] HTTPS/TLS 1.3 for all external traffic
- [ ] API Gateway with rate limiting and WAF
- [ ] OAuth 2.1 with MFA for all users
- [ ] Fine-grained authorization policies (OPA)
- [ ] Audit logging for all access
- [ ] Encryption at rest (AES-256)
- [ ] Encryption in transit (TLS 1.3)
- [ ] mTLS between services
- [ ] Network policies (no unnecessary access)
- [ ] Secrets management (no hardcoded credentials)
- [ ] Key rotation (automated 90-day)
- [ ] PII detection and redaction
- [ ] Consent management (GDPR/PDPA)
- [ ] Right to erasure capability
- [ ] Immutable audit logs with signatures
- [ ] Vulnerability scanning (containers, dependencies)
- [ ] Penetration testing (before production)
- [ ] Incident response plan
- [ ] Data backup and recovery tested
- [ ] Security training for team

## Additional Resources

- [Architecture Specification](architecture_specification.md) — Complete design
- [Implementation Plan](implementation_plan.md) — 4-week roadmap
- [Thai Law Reframe](thai_law_reframe.md) — PDPA compliance
- [Week 04 Summary](../DETAILED_COURSE_SUMMARY.md#v-week-04-secure-governance-and-compliance) — Deep dive
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Common vulnerabilities
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework/) — Industry standard

---

**Last Updated**: February 2026  
**For Questions**: See security documentation or course materials

**Key Takeaway**: Security is not a checklist—it's a mindset. Every design decision should assume breach. Every layer should defend itself. Every access should be logged.
