import re
from pathlib import Path


def _read_permissions() -> list[str]:
    """Đọc PERMISSIONS từ seed.py mà không import module (tránh side effect)."""
    content = Path("app/scripts/seed.py").read_text(encoding="utf-8")
    match = re.search(r"PERMISSIONS = \[(.*?)\]", content, re.DOTALL)
    return re.findall(r'"([^"]+)"', match.group(1))


def test_permission_codes_are_unique():
    perms = _read_permissions()
    assert len(perms) == len(set(perms))


def test_permission_format():
    for p in _read_permissions():
        assert "." in p, f"Permission {p} should have format <resource>.<action>"
        resource, action = p.split(".", 1)
        assert resource and action