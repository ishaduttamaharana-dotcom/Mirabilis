"""Encrypt-at-rest helper for site_settings secrets (SMTP password, Blogger
API key). Fernet (AES-128-CBC + HMAC) keyed from SECRETS_ENCRYPTION_KEY —
symmetric, so the same key that encrypts must be present to decrypt; there
is no plan to ever return these values to the client, so decryption only
ever happens server-side (e.g. when actually sending mail).
"""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


def _fernet() -> Fernet:
    # SECRETS_ENCRYPTION_KEY can be any string in .env; Fernet needs a
    # 32-byte urlsafe-base64 key, so derive one deterministically via SHA-256
    # rather than requiring operators to hand-generate a Fernet key.
    raw = get_settings().secrets_encryption_key.encode("utf-8")
    derived = hashlib.sha256(raw).digest()
    return Fernet(base64.urlsafe_b64encode(derived))


def encrypt_secret(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str | None:
    """Returns None instead of raising on a corrupt/foreign-key token —
    callers treat that the same as "not configured" rather than crashing."""
    try:
        return _fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError):
        return None
