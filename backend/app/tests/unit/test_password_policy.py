import pytest

from app.core.password_policy import PasswordPolicyError, validate_password


def test_valid_password():
    validate_password("MyStr0ng!Pass2024")


def test_too_short():
    with pytest.raises(PasswordPolicyError):
        validate_password("Ab1!")


def test_no_uppercase():
    with pytest.raises(PasswordPolicyError):
        validate_password("mystr0ng!pass2024")


def test_no_lowercase():
    with pytest.raises(PasswordPolicyError):
        validate_password("MYSTR0NG!PASS2024")


def test_no_digit():
    with pytest.raises(PasswordPolicyError):
        validate_password("MyStrong!PassWord")


def test_no_special():
    with pytest.raises(PasswordPolicyError):
        validate_password("MyStr0ngPass2024")


def test_common_password():
    with pytest.raises(PasswordPolicyError):
        validate_password("password123")