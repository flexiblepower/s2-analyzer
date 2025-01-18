# Dockerfile.simulation
FROM python:3.10-slim

# Create a working directory
WORKDIR /app

# Copy Python script and config
COPY send_messages.py .
COPY config.yaml .

# Install dependencies
RUN pip install requests websockets PyYAML

# Run the Python script by default
CMD ["python", "run_simulation.py"]