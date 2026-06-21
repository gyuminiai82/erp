import re
import sys

def patch():
    try:
        with open('backend/models.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # Add attendance_policy_id to Employee
    if 'attendance_policy_id' not in content:
        content = re.sub(
            r'(position_id = Column\(Integer, ForeignKey\("positions\.id"\), nullable=True\))',
            r'\1\n    attendance_policy_id = Column(Integer, ForeignKey("attendance_policies.id"), nullable=True)',
            content
        )
        content = re.sub(
            r'(position = relationship\("Position", back_populates="employees"\))',
            r'\1\n    attendance_policy = relationship("AttendancePolicy")',
            content
        )

    # Append Order and OrderItem
    if 'class Order(' not in content:
        content += '''
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, unique=True, index=True)
    order_type = Column(String, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    order_date = Column(Date)
    delivery_date = Column(Date, nullable=True)
    status = Column(String, default="대기")
    manager_id = Column(Integer, ForeignKey("employees.id"))
    total_amount = Column(Integer, default=0)
    remarks = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    quantity = Column(Integer, default=1)
    unit_price = Column(Integer, default=0)
    total_price = Column(Integer, default=0)
    
    order = relationship("Order", back_populates="items")
'''

    with open('backend/models.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("models.py patched successfully")

if __name__ == "__main__":
    patch()
