import pytest
from core.auth import decode_jwt_token
from jose.exceptions import JWTError

def test_jwt_decoding_valid():
    token = "your_valid_test_token_here"
    try:
        payload = decode_jwt_token(token)
        assert "sub" in payload
    except JWTError:
        assert False, "Token decoding failed unexpectedly"

def test_jwt_decoding_invalid():
    token = "invalid.token.structure"
    with pytest.raises(JWTError):
        decode_jwt_token(token)
