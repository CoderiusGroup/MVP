FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src

RUN pip install --no-cache-dir .

ENV FLASK_APP=src.app:create_app

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0"]
