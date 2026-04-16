from datetime import datetime
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class ClientRow(Base):
    __tablename__ = "clients"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    codes_json: Mapped[str] = mapped_column(Text)
    pay_group_constant: Mapped[str] = mapped_column(String)
    mappings_json: Mapped[str] = mapped_column(Text)
    benefit_group_rules_json: Mapped[str] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(String, nullable=True)

class CandidateRow(Base):
    __tablename__ = "candidates"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    client_id: Mapped[str] = mapped_column(String, ForeignKey("clients.id"))
    canonical_employee_json: Mapped[str] = mapped_column(Text, default="{}")
    canonical_employer_json: Mapped[str] = mapped_column(Text, default="{}")
    analyze_bundle_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    state: Mapped[str] = mapped_column(String, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PacketRow(Base):
    __tablename__ = "packets"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    candidate_id: Mapped[str] = mapped_column(String, ForeignKey("candidates.id"))
    source_pdf_path: Mapped[str] = mapped_column(String)
    page_image_paths_json: Mapped[str] = mapped_column(Text, default="[]")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AuditEntryRow(Base):
    __tablename__ = "audit_entries"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    candidate_id: Mapped[str] = mapped_column(String, ForeignKey("candidates.id"))
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    before_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
