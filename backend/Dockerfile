FROM python:3.12

RUN python -m pip install --upgrade pip

WORKDIR /app

COPY ./requirements.txt $WORKDIR
RUN python -m pip install -r ./requirements.txt