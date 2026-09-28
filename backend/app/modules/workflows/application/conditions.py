"""Condition evaluators."""


def consecutive_absent_gte_2(payload: dict, config: dict) -> bool:
    threshold = config.get("threshold", 2)
    return payload.get("consecutive_absent", 0) >= threshold


def lead_no_activity_after_days(payload: dict, config: dict) -> bool:
    return payload.get("days_since_last_activity", 0) >= config.get("days", 3)


def enrollment_expiring_within_days(payload: dict, config: dict) -> bool:
    return payload.get("days_remaining", 999) <= config.get("days", 14)


CONDITIONS = {
    "consecutive_absent_gte_2": consecutive_absent_gte_2,
    "lead_no_activity_after_days": lead_no_activity_after_days,
    "enrollment_expiring_within_days": enrollment_expiring_within_days,
}


def evaluate(condition_name: str, payload: dict, config: dict) -> bool:
    fn = CONDITIONS.get(condition_name)
    if not fn:
        return False
    return fn(payload, config)
