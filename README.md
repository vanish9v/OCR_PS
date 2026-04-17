# ProService OCR — AI-Assisted New Hire Packet Processing

> **The problem:** ProService Hawaii receives paper new-hire packets that currently require manual data entry through a 5-step human chain — outsourced reading, email clarification loops, auditing, and QC — before a single employee is active in PrismHR. This prototype automates the extraction-validation-mapping pipeline end-to-end, with human review at every confidence threshold.

Automates paper new-hire packet processing for ProService Hawaii by extracting, validating, and mapping handwritten form data to PrismHR codes using Claude AI.

**Author:** Avanish Venkatesh

---

## Design Philosophy

- **AI is the brains; deterministic Python is the hands and eyes.** Claude reads handwriting; scripts normalize, validate, and map. We never ask AI to do what regex can.
- **Human-in-the-loop at every low-confidence threshold.** The AI prepares; the human commits. No data enters PrismHR without explicit reviewer approval.
- **Every AI decision is auditable and reversible.** Extracted values show confidence, originals are preserved, and the reviewer can override any field.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/vanish9v/OCR_PS.git
cd OCR_PS
cp .env.example .env
# Fill claude_api with the provided Anthropic API key

# 2. Build and run (one command)
docker compose up --build -d

# 3. Open the app
open http://localhost:3000
```

The API runs on `http://localhost:8000` and the web app on `http://localhost:3000`.

To stop: `docker compose down`

## How to Use

1. **Upload a packet** — Click "+ New Packet" on the Kanban board and upload a scanned PDF new-hire packet (two sample packets included in `data/samples/`).
2. **Auto-analyze** — The system classifies each page, extracts fields with AI, validates data, maps to PrismHR codes, and reconciles across forms (~60-90 seconds).
3. **Review extracted fields** — Split-pane view: scanned page on the left, extracted fields on the right. Fields are color-coded by status: green (valid), red (missing/low-confidence), orange (format issue), yellow (cross-form conflict).
4. **Confirm reconciliation** — Resolve any cross-form conflicts (e.g., name spelled differently on two forms). A Levenshtein-distance safeguard flags potential form mixing automatically. Use "Not Sure" to flag fields for client clarification.
5. **View Prism payloads** — Preview the exact JSON payloads that would be sent to PrismHR's API (5 calls: `getClientCodes`, `importEmployees`, `commitEmployees`, `updateW4`, `updateDirectDeposit`).
6. **Draft clarification email** — For any flagged fields, generate an AI-drafted email to the client requesting clarification. Copy to clipboard or download as `.eml`.

## Running Tests

```bash
# Backend tests (90+ tests)
cd apps/api
pip install -e ".[dev]"
pytest -v -m "not integration"

# Integration tests (hits real Claude API, ~$0.15 per run)
source .env && export CLAUDE_API_KEY=$claude_api
pytest -v -m integration --timeout=180
```

## Key Features

- Upload scanned PDF packets
- AI page classification (10 form types — W-4, I-9, HW-4, Employment Form, Direct Deposit, HC-5, and more)
- AI field extraction with per-field confidence scores
- SSN/phone/date normalization + ABA routing number checksum validation
- PrismHR code mapping (handwritten text like "Retail Worker" mapped to system code `RW`)
- Cross-form canonical reconciliation with Levenshtein form-mixing safeguard
- Split-pane review (scanned page left, extracted fields right)
- AI-drafted clarification emails for flagged fields
- PrismHR API payload preview (all 5 API calls, schema-correct)
- Kanban candidate pipeline with state management
- Client codes management with mapping tables

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

**Model tiering for cost + accuracy:**
- **Claude Haiku** ($1/MTok input) — Fast page classification. Identifies which of 10 form types each scanned page is.
- **Claude Sonnet** ($3/MTok input) — Accurate field extraction. Reads handwriting with schema-targeted prompts per form type (not generic OCR).
- **Deterministic Python** — All post-extraction logic: normalization, validation, code mapping, reconciliation. No AI involved in decisions that can be made with rules.

**Pipeline stages:**
1. Preprocess (PyMuPDF: split PDF, render pages to PNG)
2. Classify (Haiku: label each page by form type)
3. Extract (Sonnet: per-form targeted field extraction with confidence)
4. Normalize (regex: SSN, phone, dates, routing numbers)
5. Validate (rules: format checks, ABA checksum, business code matching)
6. Map (lookup: text values to PrismHR codes via client configuration)
7. Reconcile (cross-form: canonical field comparison with Levenshtein safeguard)
8. Aggregate (bundle: review-ready output with field-level status)

Cost per packet: ~$0.05-0.15 depending on page count.

## Project Structure

```
.
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── routers/  # REST endpoints (candidates, clients, packets, pages)
│   │   │   ├── services/ # AI pipeline, validation, mapping, email, Prism payloads
│   │   │   ├── storage/  # Local filesystem abstraction for PDFs + page images
│   │   │   ├── types/    # Pydantic entity models
│   │   │   └── repositories/ # SQLAlchemy CRUD layer
│   │   └── scripts/      # Database seeding
│   └── web/              # Next.js 14 frontend
│       └── src/
│           ├── app/      # App Router pages (candidates, clients)
│           ├── components/# UI components (14 total)
│           └── lib/      # Typed API client
├── data/
│   ├── clients/          # Client code configurations (Jordan's Surf Shack)
│   └── samples/          # Sample new-hire packets (LeBron James, Taylor Swift)
├── docker-compose.yml    # One-command deployment
└── .env.example          # Configuration template
```

## What I'd Build Next

With more time and resources, the natural extensions are:

- **Dashboard analytics** — Cycle time from upload to PrismHR commit, clarification rate, forms-per-day KPIs
- **Full audit log** — Every AI extraction decision, every human correction, every API submission logged with actor + timestamp
- **Real PrismHR integration** — Live API calls with two-phase commit (import → commit) instead of payload preview
- **Email sending via Microsoft Graph** — Send clarification emails directly from the app (currently draft + copy/download)
- **Email inbox listener** — Auto-ingest packets from a shared mailbox, create candidates automatically
- **Multi-state tax forms** — Support state tax forms beyond Hawaii's HW-4
- **OCR training loop** — Feed reviewer corrections back to improve extraction prompts over time
- **Batch finalize** — Submit all "Ready" candidates to PrismHR in one click with partial-failure handling + per-candidate retry

## Tech Stack

| Component        | Technology                              |
| ---------------- | --------------------------------------- |
| Backend          | FastAPI (Python 3.12)                   |
| Frontend         | Next.js 14 (TypeScript, App Router)     |
| Database         | SQLAlchemy 2.0 + SQLite                 |
| PDF Processing   | PyMuPDF (fitz)                          |
| AI Models        | Claude Haiku 4.5 + Claude Sonnet 4.6    |
| AI SDK           | Anthropic Python SDK                    |
| Styling          | Tailwind CSS 3.4                        |
| Icons            | Lucide React                            |
| Infrastructure   | Docker Compose                          |
| Fuzzy Matching   | python-Levenshtein                      |
