import os

def patch_models():
    models_path = 'backend/models.py'
    with open(models_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'class Project(' in content:
        print("Models already exist.")
        return

    new_models = """

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    budget = Column(Float, default=0.0)
    status = Column(String(50), default="PLANNED") # PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client")
    manager = relationship("Employee")
"""
    with open(models_path, 'a', encoding='utf-8') as f:
        f.write(new_models)
    print("Project model added successfully.")

if __name__ == "__main__":
    patch_models()
