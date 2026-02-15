# 🏗️ Integration Architecture Overview

## System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Local Computer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│           ┌──────────────────────────────────────────┐           │
│           │      Mockup-Infra (Network Stack)        │           │
│           │                                          │           │
│           │  ┌────────────────────────────────────┐ │           │
│           │  │  L7: Application Layer             │ │           │
│           │  │  ├─ public_app (HTTP :8080)        │ │           │
│           │  │  ├─ intranet_api (HTTPS :443)      │ │           │
│           │  │  ├─ upload-service (:8000) [W03]   │ │           │
│           │  │  ├─ processing-service (Mock) [W03] │ │           │
│           │  │  ├─ ai-service (Mock) [W03]        │ │           │
│           │  │  └─ nginx-gateway (Reverse Proxy)  │ │           │
│           │  └────────────────────────────────────┘ │           │
│           │  ┌────────────────────────────────────┐ │           │
│           │  │  Profiles (Isolation)              │ │           │
│           │  │  ├─ default (Always on)            │ │           │
│           │  │  ├─ week01 (MIME services)         │ │           │
│           │  │  ├─ week02 (Stateful APIs)         │ │           │
│           │  │  └─ week03 (Microservices)         │ │           │
│           │  └────────────────────────────────────┘ │           │
│           │  ┌────────────────────────────────────┐ │           │
│           │  │  L3: Network                       │ │           │
│           │  │  ├─ public_net (172.18.0.0/16)    │ │           │
│           │  │  └─ private_net (172.19.0.0/16)   │ │           │
│           │  └────────────────────────────────────┘ │           │
│           │                                          │           │
│           └──────────────────────────────────────────┘           │
│                                                                   │
│           ┌──────────────────────────────────────────┐           │
│           │    MIME-Typing (TCP File Transfer)      │           │
│           │                                          │           │
│           │  ┌────────────────────────────────────┐ │           │
│           │  │  L7: file transfer protocol        │ │           │
│           │  │  └─ JSON headers + binary data    │ │           │
│           │  └────────────────────────────────────┘ │           │
│           │  ┌────────────────────────────────────┐ │           │
│           │  │  L4: TCP Socket                    │ │           │
│           │  │  └─ Port :65432                   │ │           │
│           │  └────────────────────────────────────┘ │           │
│           │  ┌────────────────────────────────────┐ │           │
│           │  │  L3: Loopback Network              │ │           │
│           │  │  └─ 127.0.0.1                     │ │           │
│           │  └────────────────────────────────────┘ │           │
│           │                                          │           │
│           └──────────────────────────────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Mockup-Infra (OSI Layer 3-7)

| Layer | Component | Purpose |
|-------|-----------|---------|
| **L7** | public_app | HTTP server (port 8080) serving HTML |
| **L7** | intranet_api | Flask REST API over HTTPS |
| **L7** | upload-service | Week 03: File ingestion (public_net) |
| **L7** | processing-service | Week 03: Mock file processor (private_net) |
| **L7** | ai-service | Week 03: Mock AI analyzer (private_net) |
| **L7** | nginx-gateway | Reverse proxy & TLS terminator |
| **L5/6** | Session Layer | SSL Termination & Podman Profiles |
| **L4** | TCP | Port mapping & inter-service communication |
| **L3** | Podman bridges | Isolated network segments (172.18, 172.19) |

### MIME-Typing (Layer 4 only)

| Layer | Component | Purpose |
|-------|-----------|---------|
| **L7** | MIME protocol | JSON file metadata + binary payload |
| **L4** | TCP socket | Reliable connection-based transfer |
| **L3** | Loopback | 127.0.0.1 (same machine) |

---

## Data Flow Examples

### Example 1: Web Request Through Mockup-Infra

```
User Browser (localhost:8080)
    │
    ├─ Connects to Port 8080 ────────────────────── [L4: TCP]
    │
    ├─ Request HTTP GET / ──────────────────────── [L7: HTTP]
    │
    ├─ (no TLS on public path to public_app)
    │
    ├─ Received by: nginx-gateway ──────────────── [L7: L7 Proxy]
    │
    ├─ Proxied to: public_app:80 ───────────────── [L7: Route]
    │
    ├─ L3 Bridge: public_net communicates
    │   (172.18.0.0/16) ────────────────────────── [L3: Network]
    │
    └─ Response: HTML page from public_app ──────── [L7: HTTP]
```

### Example 2: MIME File Transfer

```
Client Process
    │
    ├─ Connects to Port 65432 ──────────────────── [L4: TCP]
    │
    ├─ Prepares file with JSON header:
    │  {"mime_type": "text/plain", "size": 1234}
    │
    ├─ Sends: [JSON header]\n[binary data] ──────── [L7: Protocol]
    │
    ├─ Transport: Reliable TCP stream ──────────── [L4: TCP]
    │
    ├─ Network: Loopback (same machine) ────────── [L3: Network]
    │
    └─ Received by: MIME Server
       (Saves to storage/received_XXXX.ext)
```

---

## Data Flow Integration

### Separate Operation

```
┌─────────────┐              ┌──────────────┐
│   Browser   │──:8080──────▶│ Mockup-Infra │
└─────────────┘              │   (L3-L7)    │
                             └──────────────┘

┌─────────────┐              ┌──────────────┐
│   MIME      │──:65432─────▶│ MIME Server  │
│   Client    │              │   (TCP)      │
└─────────────┘              └──────────────┘
```

### Combined Operation

```
Mockup-Infra Handles:
  - HTTP/HTTPS traffic (:8080, :443)
  - Network layer concepts (bridges, isolation)
  - Multi-layer stack demonstration

MIME-Typing Handles:
  - File transfer protocol (:65432)
  - TCP socket concepts
  - JSON header protocol

Both Together Demonstrate:
  - How infrastructure components coexist
  - Parallel network services
  - Independent protocols and layers
  - No built-in message passing required
```

---

## Process Orchestration

### File System Layout

```
D:\boonsup\automation\
├── mockup-infra/
│   ├── manage.py                 ← Orchestrator
│   ├── docker-compose.yml        ← Container config
│   ├── certs/                    ← TLS certificates
│   ├── services/                 ← App containers
│   └── gateway/                  ← Nginx config
│
├── week01-mime-typing/
│   ├── manage-mime.py            ← Orchestrator (NEW)
│   ├── server/                   ← MIME server code
│   ├── client/                   ← MIME client code
│   ├── storage/                  ← Received files
│   └── assets/                   ← Test files
│
├── demo-integration.py           ← Main launcher (NEW)
├── QUICK_START.md                ← Quick reference (NEW)
└── INTEGRATION.md                ← Full guide (NEW)
```

### Execution Model

```
Terminal 1: Mockup-Infra
    python manage.py init
    python manage.py deploy
    → Containers: nginx, public_app, intranet_api
    → Keeps running

Terminal 2: MIME Server
    python manage-mime.py server
    → Process: File transfer listener
    → Keeps running

Terminal 3: MIME Client
    python manage-mime.py client
    → Sends files
    → Completes
```

---

## Network Isolation Concepts

### Mockup-Infra: Container Networks

```
Host Network       ┌──────────────────────────────────┐
:8080, :443       │ Podman Container Network           │
                  │                                    │
                  │  ┌─────────────────────────────┐ │
                  │  │ public_net                  │ │
                  │  │ 172.18.0.0/16               │ │
                  │  │ ┌──────────────────────────┐│ │
                  │  │ │ nginx-gateway:172.18.0.2 ││ │
                  │  │ │ public_app:172.18.0.3    ││ │
                  │  │ └──────────────────────────┘│ │
                  │  └─────────────────────────────┘ │
                  │                                    │
                  │  ┌─────────────────────────────┐ │
                  │  │ private_net (internal=true) │ │
                  │  │ 172.19.0.0/16               │ │
                  │  │ ┌──────────────────────────┐│ │
                  │  │ │intranet_api:172.19.0.2  ││ │
                  │  │ │(isolated from outside)   ││ │
                  │  │ └──────────────────────────┘│ │
                  │  └─────────────────────────────┘ │
                  │                                    │
                  └──────────────────────────────────┘
```

### MIME-Typing: Loopback (No Isolation)

```
Host Network       ┌──────────────────────────────────┐
:65432            │ Loopback Network                   │
                  │                                    │
                  │  127.0.0.1                        │
                  │  ├─ Client (ephemeral port)      │
                  │  └─ Server (port 65432)          │
                  │     [No network bridges needed]   │
                  │                                    │
                  └──────────────────────────────────┘
```

---

## Protocol Comparison

### Mockup-Infra Protocols

| Protocol | Layer | Example |
|----------|-------|---------|
| TLS 1.3 | L5/6 | Encrypted HTTPS to :443 |
| HTTP | L7 | GET / HTTP/1.1 |
| TCP | L4 | Port 8080, 443 |
| Podman Bridge | L3 | 172.18.x.x routing |

### MIME-Typing Protocol

```
Wire Format:
[UTF-8 JSON]\n[Binary Data]

JSON Example:
{"mime_type": "text/plain", "size": 1234}

Binary Payload:
<1234 bytes of file content>

Full Message:
{"mime_type": "text/plain", "size": 5}\nhello
```

---

## Performance Characteristics

### Mockup-Infra

- **Startup:** ~35 seconds (init 15s + deploy 20s)
- **Throughput:** Limited by Nginx proxy (~100 req/s)
- **Latency:** ~50-100ms per request
- **Connections:** Supports multiple concurrent clients

### MIME-Typing

- **Startup:** <1 second (immediate listen)
- **Throughput:** Network speed (no bottleneck)
- **Latency:** <10ms per file
- **Connections:** Single-threaded (1 client) or multi-threaded (N clients)

---

## Key Lessons

### What Each System Teaches

**Mockup-Infra:**
- ✓ OSI Layer awareness (L3, L4, L5/6, L7)
- ✓ Container networking
- ✓ Reverse proxy concepts
- ✓ TLS/SSL security
- ✓ Network isolation
- ✓ Service discovery

**MIME-Typing:**
- ✓ TCP socket programming
- ✓ Protocol design (JSON headers)
- ✓ Reliable data transfer
- ✓ Client-server architecture
- ✓ File transfer mechanics
- ✓ Error handling

**Together:**
- ✓ Infrastructure operates independently
- ✓ Multiple protocols can coexist
- ✓ Different layers serve different purposes
- ✓ No built-in coordination needed (loosely coupled)

---

## Extension Possibilities

### 1. Integrate MIME into Mockup-Infra Nginx

Add location block in nginx.conf:
```nginx
location /upload {
    proxy_pass http://mime-server:65432;
}
```

Benefits: MIME becomes an HTTP endpoint

### 2. Containerize MIME Server

Create Dockerfile for MIME server, add to docker-compose.yml

Benefits: MIME joins infra's container network

### 3. Add Authentication Layer

Use TLS certificates from mockup-infra for MIME connections

Benefits: Secure cross-system communication

### 4. Store Files in Mockup-Infra

Mount storage/ as Podman volume shared with intranet_api

Benefits: MIME becomes data ingestion point

---

## Troubleshooting Flow

```
Service Won't Start?
├─ Check if ports are available
├─ Check if dependencies installed
└─ Check logs for errors

Can't Connect?
├─ Verify service is running (python manage-mime.py status)
├─ Verify port is correct
└─ Check firewall/TCP

Transfer Failed?
├─ Check server logs
├─ Verify file exists on client
├─ Check file permissions
└─ Verify message format (JSON header)

Integration Failed?
├─ Verify mockup-infra is running (python manage.py status)
├─ Verify MIME server is running (python manage-mime.py status)
├─ Test each independently first
└─ Then test together
```

---

## Next Steps

1. **Run the integration:** `python demo-integration.py`
2. **Observe both systems:** Check ports :8080, :443, :65432
3. **Analyze network traffic:** Use tcpdump or Wireshark
4. **Extend the protocol:** Add checksums or encryption to MIME
5. **Containerize MIME:** Move to Podman like mockup-infra
6. **Integrate fully:** Connect via Nginx proxy

---

**Version:** 1.0 | **Status:** ✅ Production Ready
**Last Updated:** February 2026

⭐ **Remember:** Real infrastructure is made of independent systems working together through well-defined protocols, not monolithic blocks!
