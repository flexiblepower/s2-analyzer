FROM python:3.11-slim

ENTRYPOINT []
EXPOSE 8001/tcp

RUN mkdir -p /app

COPY ./requirements.txt     /app/s2_analyzer_backend/
RUN pip3 install -r /app/s2_analyzer_backend/requirements.txt

COPY ./s2_analyzer_backend/ /app/s2_analyzer_backend/
COPY ./docker_run.sh        /app/
COPY ./deployment/          /app/

WORKDIR /app/

ENV S2_ANALYZER_CONF=./config.yaml

CMD ["python3","-m","s2_analyzer_backend.main"]
