from app.core.security import hash_password, verify_password


def test_hash_and_verify():
    hashed = hash_password("MyStr0ng!Pass2024")
    assert verify_password("MyStr0ng!Pass2024", hashed)
    assert not verify_password("WrongPass123!@#", hashed)


def test_hash_is_different_each_time():
    h1 = hash_password("MyStr0ng!Pass2024")
    h2 = hash_password("MyStr0ng!Pass2024")
    assert h1 != h2  # salt khác
    assert verify_password("MyStr0ng!Pass2024", h1)
    assert verify_password("MyStr0ng!Pass2024", h2)