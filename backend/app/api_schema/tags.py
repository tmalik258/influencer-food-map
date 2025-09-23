from datetime import datetime
from uuid import UUID
from typing import List
from pydantic import BaseModel
from pydantic.config import ConfigDict

class TagResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TagCreate(BaseModel):
    name: str

class TagUpdate(BaseModel):
    name: str

class PaginatedTagsResponse(BaseModel):
    tags: List[TagResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)