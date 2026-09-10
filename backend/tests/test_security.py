from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip():
    plaintext = "correct horse battery staple 42"
    hashed = hash_password(plaintext)
    assert hashed != plaintext
    assert verify_password(plaintext, hashed)
    assert not verify_password("wrong-password", hashed)


def test_access_token_roundtrip():
    token = create_access_token(subject="user-id-123", role="editor")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-id-123"
    assert payload["role"] == "editor"
    assert payload["type"] == "access"
