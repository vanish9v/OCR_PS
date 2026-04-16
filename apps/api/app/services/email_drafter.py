# apps/api/app/services/email_drafter.py
from app.services.anthropic_client import generate_text

SYSTEM = """You are a professional HR assistant at ProService Hawaii.
Draft a clarification email to a client about issues found in a new hire's paper packet.
Be concise, professional, and specific about which fields need attention.
Format: first line is "Subject: ..." followed by a blank line, then the email body.
Do not use markdown. Plain text only."""

def draft_clarification_email(
    candidate_name: str,
    client_name: str,
    issues: list[dict],
) -> dict:
    """Draft a clarification email for fields needing attention."""
    issue_lines = []
    for i, issue in enumerate(issues, 1):
        issue_lines.append(f"{i}. {issue['field']} ({issue['form']}) — {issue['reason']}")

    prompt = f"""Draft a clarification email for the following new hire packet:

Candidate: {candidate_name}
Client/Employer: {client_name}

Issues requiring clarification:
{chr(10).join(issue_lines)}

The email should be addressed to the client contact, reference the candidate by name,
list each issue clearly, and ask for a response."""

    raw = generate_text(system=SYSTEM, prompt=prompt)

    # Parse subject from first line
    lines = raw.strip().split("\n")
    subject = ""
    body = raw
    if lines[0].lower().startswith("subject:"):
        subject = lines[0].replace("Subject:", "").replace("subject:", "").strip()
        body = "\n".join(lines[1:]).strip()

    return {
        "subject": subject or f"Clarification Needed — {candidate_name}",
        "body": body,
        "to": f"contact@{client_name.lower().replace(' ', '').replace(chr(39), '')}.com",
        "candidate_name": candidate_name,
        "issues_count": len(issues),
    }
