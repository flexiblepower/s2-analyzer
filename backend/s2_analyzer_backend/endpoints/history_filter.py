import uuid
from fastapi import HTTPException, Depends
from typing import Optional, List
from datetime import datetime
import logging
from sqlmodel import Session, select, func
from s2_analyzer_backend.device_connection.session_details import SessionDetails
from s2_analyzer_backend.message_processor.database import (
    Communication,
    get_session,
    serialize_communication_with_validation_errors,
)

LOGGER = logging.getLogger(__name__)


class HistoryFilter:
    """Utility class used to perform queries on the Communication database table."""

    def __init__(self, session: Session = Depends(get_session)):
        self.session = session

    def get_filtered_records(
        self,
        session_id: Optional[uuid.UUID] = None,
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
                "session_id": session_id,
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

            results = []
            for comm in self.session.exec(query).all():
                results.append(
                    serialize_communication_with_validation_errors(comm).model_dump()
                )

            return results

        except Exception as e:
            LOGGER.error(f"Error in get_filtered_records: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    def get_s2_session_history(self, session_id: uuid.UUID):
        query = select(Communication).where(Communication.session_id == session_id)

        for comm in self.session.exec(query).all():
            data = serialize_communication_with_validation_errors(comm)
            yield data

    def get_unique_sessions(self) -> List[SessionDetails]:
        """
        Retrieves unique sessions with start and end timestamps,
        ordered by end timestamp.
        """
        statement = select(Communication.session_id).distinct()
        unique_session_ids: List[uuid.UUID] = self.session.exec(statement).all()

        session_details: List[SessionDetails] = []
        for session_id in unique_session_ids:
            # Get start and end timestamps
            start_statement = select(func.min(Communication.timestamp)).where(
                Communication.session_id == session_id
            )
            start_timestamp: datetime = self.session.exec(start_statement).first()

            end_statement = select(func.max(Communication.timestamp)).where(
                Communication.session_id == session_id
            )
            end_timestamp: datetime = self.session.exec(end_statement).first()

            communication_statement = (
                select(Communication)
                .where(Communication.session_id == session_id)
                .limit(1)
            )
            communication = self.session.exec(communication_statement).first()

            if (
                communication
                and start_timestamp
                and end_timestamp
            ):
                session_details.append(
                    SessionDetails(
                        session_id=communication.session_id,
                        cem_id=communication.cem_id,
                        rm_id=communication.rm_id,
                        start_timestamp=start_timestamp,
                        end_timestamp=end_timestamp,
                        state="closed",
                    )
                )

        # Sort by end_timestamp
        session_details.sort(key=lambda x: x.end_timestamp, reverse=True)
        return session_details