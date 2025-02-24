from sqlalchemy import (
    Column, ForeignKey, Integer, String, Date,
    Text, CheckConstraint, TIMESTAMP, Enum, Numeric, Time
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

# Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())