"""Password policy — enforce theo SECURITY.md.

Yêu cầu:
- Min 12 ký tự
- Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
- Không nằm trong common password list
"""

import re

MIN_LENGTH = 12
COMMON_PASSWORDS = {
    "password", "123456", "qwerty", "abc123", "letmein",
    "welcome", "monkey", "dragon", "master", "admin",
    "password1", "password123", "admin123", "welcome123",
}


class PasswordPolicyError(ValueError):
    pass


def validate_password(password: str) -> None:
    """Raise PasswordPolicyError nếu password không đạt yêu cầu."""
    if len(password) < MIN_LENGTH:
        raise PasswordPolicyError(f"Password must be at least {MIN_LENGTH} characters")

    if password.lower() in COMMON_PASSWORDS:
        raise PasswordPolicyError("Password is too common")

    if not re.search(r"[A-Z]", password):
        raise PasswordPolicyError("Password must contain at least one uppercase letter")

    if not re.search(r"[a-z]", password):
        raise PasswordPolicyError("Password must contain at least one lowercase letter")

    if not re.search(r"\d", password):
        raise PasswordPolicyError("Password must contain at least one digit")

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\;'`~/]", password):
        raise PasswordPolicyError("Password must contain at least one special character")