from datetime import datetime
from typing import Literal, Optional
import uuid
from pydantic import BaseModel


class SessionDetails(BaseModel):
    """Pydantic model used to serialize the connection information
    for the connection list endpoint."""

    session_id: uuid.UUID
    cem_id: str | None = None
    rm_id: str | None = None

    start_timestamp: datetime
    end_timestamp: Optional[datetime] = None

    state: Literal["closed", "open"]
