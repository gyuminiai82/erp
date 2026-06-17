import re

def patch():
    try:
        with open('backend/settings.py', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(e)
        return

    # Add to SystemSettingSchema
    if 'tardiness_penalty_type' not in content:
        schema_str = '''    holiday_overtime_multiplier: float = 2.0'''
        new_schema_str = schema_str + '''\n    tardiness_penalty_type: str = "NONE"\n    tardiness_grace_period: int = 0'''
        content = content.replace(schema_str, new_schema_str)

        update_schema_str = '''    holiday_overtime_multiplier: Optional[float] = None'''
        new_update_schema_str = update_schema_str + '''\n    tardiness_penalty_type: Optional[str] = None\n    tardiness_grace_period: Optional[int] = None'''
        content = content.replace(update_schema_str, new_update_schema_str)

        get_settings_str = '''            holiday_overtime_multiplier=2.0'''
        new_get_settings_str = get_settings_str + ''',\n            tardiness_penalty_type="NONE",\n            tardiness_grace_period=0'''
        content = content.replace(get_settings_str, new_get_settings_str)

        old_settings_str = '''        "holiday_overtime_multiplier": setting.holiday_overtime_multiplier'''
        new_old_settings_str = old_settings_str + ''',\n        "tardiness_penalty_type": setting.tardiness_penalty_type,\n        "tardiness_grace_period": setting.tardiness_grace_period'''
        content = content.replace(old_settings_str, new_old_settings_str)

        is_payroll_changed_str = '''        is_payroll_changed = any(k.endswith("_rate") or k.endswith("_multiplier") for k in changed_keys)'''
        new_is_payroll_changed_str = is_payroll_changed_str + '''\n        is_tardiness_changed = any(k.startswith("tardiness_") for k in changed_keys)'''
        content = content.replace(is_payroll_changed_str, new_is_payroll_changed_str)

        # Update the event_title logic for tardiness
        logic_str = '''        if is_rules_changed and is_payroll_changed:'''
        new_logic_str = '''        if is_tardiness_changed:
            event_title = "지각/근태 정책 변경"
            event_desc = "지각 처리 방식 및 허용 시간이 변경되었습니다."
        elif is_rules_changed and is_payroll_changed:'''
        content = content.replace(logic_str, new_logic_str)

        with open('backend/settings.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched settings.py")
    else:
        print("Already patched")

if __name__ == "__main__":
    patch()
