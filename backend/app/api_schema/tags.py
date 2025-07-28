from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from pydantic.config import ConfigDict

class TagResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)