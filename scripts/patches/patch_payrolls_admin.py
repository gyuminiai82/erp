import re

def patch():
    try:
        with open('backend/payrolls_api.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # Replace import
    old_import = "from auth import get_current_employee"
    new_import = "from auth import get_current_employee, get_current_user_info"
    content = content.replace(old_import, new_import)

    # get_payrolls
    old_get = "def get_payrolls(month: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):"
    new_get = "def get_payrolls(month: Optional[str] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):"
    content = content.replace(old_get, new_get)

    # generate_payrolls
    old_gen = "def generate_payrolls(payload: PayrollGenerateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):"
    new_gen = "def generate_payrolls(payload: PayrollGenerateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):"
    content = content.replace(old_gen, new_gen)

    # bulk_create_payrolls
    old_bulk_c = "def bulk_create_payrolls(payload: BulkPayrollCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):"
    new_bulk_c = "def bulk_create_payrolls(payload: BulkPayrollCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):"
    content = content.replace(old_bulk_c, new_bulk_c)

    # bulk_update_payrolls
    old_bulk_u = "def bulk_update_payrolls(payload: BulkPayrollUpdateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):"
    new_bulk_u = "def bulk_update_payrolls(payload: BulkPayrollUpdateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):"
    content = content.replace(old_bulk_u, new_bulk_u)

    # bulk_delete_payrolls
    old_bulk_d = "def bulk_delete_payrolls(payload: BulkPayrollDeleteRequest, db: Session = Depends(get_db), current_user = Depends(get_current_employee)):"
    new_bulk_d = "def bulk_delete_payrolls(payload: BulkPayrollDeleteRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user_info)):"
    content = content.replace(old_bulk_d, new_bulk_d)

    with open('backend/payrolls_api.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched payrolls_api.py dependencies for admin access")

if __name__ == "__main__":
    patch()
