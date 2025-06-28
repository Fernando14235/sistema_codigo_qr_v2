from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    usuario_id: int | None = None
    username: EmailStr | None = None
    rol: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token:   str
    token_type:     str
    usuario:        EmailStr
    rol:            str
    refresh_token:  str