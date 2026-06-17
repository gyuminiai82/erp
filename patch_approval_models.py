import os

def patch_models():
    models_path = 'backend/models.py'
    with open(models_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'class ApprovalDocument(' in content:
        print("Models already exist.")
        return

    new_models = """
class ApprovalDocument(Base):
    __tablename__ = "approval_documents"

    id = Column(Integer, primary_key=True, index=True)
    drafter_id = Column(Integer, ForeignKey("employees.id"))
    document_type = Column(String(50)) # 기안서, 품의서 등
    title = Column(String(200), nullable=False)
    content = Column(Text)
    status = Column(String(20), default="DRAFT") # DRAFT, IN_PROGRESS, APPROVED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    drafter = relationship("Employee", foreign_keys=[drafter_id])
    approval_lines = relationship("ApprovalLine", back_populates="document", cascade="all, delete")


class ApprovalLine(Base):
    __tablename__ = "approval_lines"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("approval_documents.id"))
    approver_id = Column(Integer, ForeignKey("employees.id"))
    sequence_no = Column(Integer) # 1차, 2차 등
    status = Column(String(20), default="PENDING") # PENDING, APPROVED, REJECTED
    comment = Column(Text, nullable=True)
    acted_at = Column(DateTime(timezone=True), nullable=True)

    document = relationship("ApprovalDocument", back_populates="approval_lines")
    approver = relationship("Employee", foreign_keys=[approver_id])
"""
    with open(models_path, 'a', encoding='utf-8') as f:
        f.write(new_models)
    print("Models added successfully.")

if __name__ == "__main__":
    patch_models()
