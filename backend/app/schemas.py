from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from .models import TodoStatus

# --- User Schemas ---
class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

# --- Todo Schemas ---
class TodoBase(BaseModel):
    title: str = Field(..., min_length=1)
    body: Optional[str] = None
    status: TodoStatus = TodoStatus.PENDING

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    status: Optional[TodoStatus] = None

class TodoResponse(TodoBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Guest Todo Schemas ---
class GuestTodoCreate(BaseModel):
    title: str = Field(..., min_length=1)
    body: Optional[str] = None

class GuestTodoResponse(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
