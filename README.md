# ProService OCR — AI-Assisted New Hire Packet Processing

Automates paper new-hire packet processing for ProService Hawaii by extracting, validating, and mapping handwritten form data to PrismHR codes.

**Author:** Avanish Venkatesh

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

## Quick Start

```bash
cp .env.example .env
# Fill claude_api with the provided Anthropic API key
docker compose up --build -d
# Open http://localhost:3000
```

The API runs on `http://localhost:8000` and the web app on `http://localhost:3000`.

## How to Use

1. **Upload a packet** — Click "+ New Packet" on the Kanban board and upload a scanned PDF new-hire packet.
2. **Auto-analyze** — The system classifies each page, extracts fields with AI, validates data, maps to PrismHR codes, and reconciles across forms. Progress updates stream in real time.
3. **Review extracted fields** — Split-pane view: scanned page on the left, extracted fields on the right. Fields are color-coded by confidence (green/yellow/orange/red).
4. **Confirm reconciliation** — Resolve any cross-form conflicts (e.g., name spelled differently on two forms). A Levenshtein-distance safeguard flags mismatches automatically.
5. **View Prism payloads** — Preview the exact JSON payloads that would be sent to PrismHR's API (5 calls: getClientCodes, importEmployees, commitEmployees, updateW4, updateDirectDeposit).
6. **Draft clarification email** — For any flagged fields, generate an AI-drafted email to the client requesting clarification.

## Key Features

- Upload scanned PDF packets
- AI page classification (10 form types)
- AI field extraction with confidence scores
- SSN/phone/date normalization + ABA routing checksum
- PrismHR code mapping (text to system codes)
- Cross-form canonical reconciliation with form-mixing safeguard
- Split-pane review (scan left, fields right)
- Clarification email drafting (AI-generated)
- PrismHR API payload preview (5 calls)
- Kanban candidate pipeline
- Client codes management

## Architecture

```
+----------------+      +------------------+      +-------------------+
|  Next.js 14    | ---> |  FastAPI (Python) | ---> |  Claude AI        |
|  (TypeScript)  |      |  REST API         |      |  Haiku: classify  |
|  Port 3000     |      |  Port 8000        |      |  Sonnet: extract  |
+----------------+      +------------------+      +-------------------+
                              |
                         SQLite + filesystem
```

- **FastAPI** — Python backend handling PDF processing, AI orchestration, validation, and code mapping.
- **Next.js 14** — TypeScript frontend with App Router, Tailwind CSS, split-pane review UI.
- **Claude AI** — Haiku for fast page classification, Sonnet for accurate field extraction.
- **Docker Compose** — Single-command deployment with health checks.

## Project Structure

```
.
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── routers/  # REST endpoints (candidates, clients, packets)
│   │   │   ├── services/ # AI pipeline, validation, code mapping, email drafter
│   │   │   └── models/   # SQLAlchemy models
│   │   └── tests/        # pytest test suite (90+ tests)
│   └── web/              # Next.js 14 frontend
│       └── src/
│           ├── app/      # App Router pages (candidates, clients, upload)
│           ├── components/# Reusable UI components
│           └── lib/      # API client, utilities
├── data/                 # SQLite DB, uploaded PDFs, processed page images
├── docs/                 # Design spec, ADRs, plans
├── scripts/              # Packaging and utility scripts
├── docker-compose.yml
└── .env.example
```

## Design Decisions

See the full design specification and architecture decision records:

- [Design Spec](docs/superpowers/specs/2026-04-14-proservice-ocr-design.md)
- [Architecture Decision Records](docs/adr/)

## What I'd Build Next

- **Dashboard analytics** — Cycle time, clarification rate, forms-per-day KPIs
- **Audit log** — Every AI decision and human action tracked for compliance
- **Real PrismHR integration** — Live API calls instead of payload preview
- **Email sending via Microsoft Graph** — Send clarification emails directly from the app
- **Email inbox listener** — Auto-ingest packets from a shared mailbox
- **Multi-state tax forms** — HW-4, state-specific W-4 variants
- **OCR training loop** — Feed corrections back to improve extraction accuracy

## Tech Stack

| Component        | Technology                        |
| ---------------- | --------------------------------- |
| Backend          | FastAPI (Python 3.12)             |
| Frontend         | Next.js 14 (TypeScript)           |
| Database         | SQLAlchemy + SQLite               |
| PDF Processing   | PyMuPDF                           |
| AI               | Anthropic SDK (Claude Haiku + Sonnet) |
| Styling          | Tailwind CSS                      |
| Infrastructure   | Docker Compose                    |
| Data Store       | SQLite (file-based)               |
