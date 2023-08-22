import datetime
import pytz


def now_as_utc() -> datetime.datetime:
    return datetime.datetime.now(tz=pytz.UTC)


def parse_timestamp_as_utc(timestamp_str: str) -> datetime.datetime:
    date_time = datetime.datetime.fromisoformat(timestamp_str)

    if date_time.tzinfo is None:
        date_time = date_time.replace(tzinfo=pytz.UTC)
    else:
        date_time = date_time.astimezone(pytz.UTC)
    return date_time
