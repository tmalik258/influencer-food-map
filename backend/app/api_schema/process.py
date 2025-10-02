from typing import Optional, List
from pydantic import BaseModel

from app.models.job import LockType

class ScrapeRequest(BaseModel):
    video_ids: Optional[List[str]] = None
    trigger_type: Optional[LockType] = LockType.AUTOMATIC