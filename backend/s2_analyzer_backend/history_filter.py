from fastapi import HTTPException, Query, Depends
from typing import Optional, List
from datetime import datetime
import logging
from sqlmodel import Session, select
from s2_analyzer_backend.database import Communication, get_session

LOGGER = logging.getLogger(__name__)

class HistoryFilter:
    def __init__(self, session: Session = Depends(get_session)):
        self.session = session

    def get_filtered_records(
        self,
        cem_id: Optional[str] = None,
        rm_id: Optional[str] = None,
        origin: Optional[str] = None,
        s2_msg_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Communication]:
        try:
            query = select(Communication)

            # Define a dictionary for dynamic filters
            filters = {
                "cem_id": cem_id,
                "rm_id": rm_id,
                "origin": origin,
                "s2_msg_type": s2_msg_type,
            }

            # Apply filters dynamically
            for field, value in filters.items():
                if value is not None:
                    query = query.where(getattr(Communication, field) == value)

            # Apply date range filters
            if start_date:
                query = query.where(Communication.timestamp >= start_date)
            if end_date:
                query = query.where(Communication.timestamp <= end_date)

            # Execute the query and return results
            results = self.session.exec(query).all()
            return results

        except Exception as e:
            LOGGER.error(f"Error in get_filtered_records: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
