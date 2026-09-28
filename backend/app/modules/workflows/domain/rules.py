"""Định nghĩa predefined rules."""

PREDEFINED_RULES = [
    {
        "code": "student_absent_rule",
        "name": "Student absent 2+ consecutive sessions",
        "trigger_event": "StudentAbsent",
        "condition": "consecutive_absent_gte_2",
        "actions": ["create_task", "notify_counselor"],
        "config": {"threshold": 2},
    },
    {
        "code": "lead_no_response_rule",
        "name": "Lead no response after 3 days",
        "trigger_event": "scheduled:lead_no_response",
        "condition": "lead_no_activity_after_days",
        "actions": ["create_task", "notify_counselor"],
        "config": {"days": 3},
    },
    {
        "code": "enrollment_expiring_rule",
        "name": "Enrollment expiring in 14 days",
        "trigger_event": "scheduled:enrollment_expiring",
        "condition": "enrollment_expiring_within_days",
        "actions": ["create_task", "notify_counselor"],
        "config": {"days": 14},
    },
]
