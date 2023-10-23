FROM python:3.10-slim

ENTRYPOINT []
EXPOSE 8001/tcp

RUN mkdir -p /app /app/logs /app/mounts

COPY ./requirements.txt     /app/s2_analyzer_backend/
RUN pip3 install -r /app/s2_analyzer_backend/requirements.txt

COPY ./s2_analyzer_backend/ /app/s2_analyzer_backend/
COPY ./docker_run.sh        /app/
COPY ./deployment/          /app/

CMD ["/app/docker_run.sh"]
