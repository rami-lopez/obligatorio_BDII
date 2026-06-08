from __future__ import annotations

import base64
import hashlib

import bcrypt


_BCRYPT_ROUNDS = 12


def _prehash_password(plain: str) -> bytes:
    digest = hashlib.sha256(plain.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(plain: str) -> str:
    prehashed = _prehash_password(plain)
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(prehashed, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    prehashed = _prehash_password(plain)
    return bcrypt.checkpw(prehashed, hashed.encode("utf-8"))