import datetime
import pytz


def now_as_utc() -> datetime.datetime:
    return datetime.datetime.now(tz=pytz.UTC)


def parse_timestamp_as_utc(timestamp_str: str) -> datetime.datetime:
    dt = datetime.datetime.fromisoformat(timestamp_str)

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=pytz.UTC)
    else:
        dt = dt.astimezone(pytz.UTC)
    return dt
