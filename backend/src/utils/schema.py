from datetime import time
from pydantic import BaseModel, EmailStr, constr, validator, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

# Base Models
class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr


# Response Models
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True