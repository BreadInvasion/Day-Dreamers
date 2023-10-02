# DayDreamers Day Planner

## Basic Architecture
Built on three **Docker** containers:

### Frontend (Typescript)
Webserver and Reverse Proxy: Caddy 2
UI Framework: React.js

### Backend (Python)
API Framework: FastAPI
Enforced Typing: Pydantic

### Database (SQL)
PostgreSQL

## To Launch
Install and run Docker Engine if you don't already have it

Execute command **docker-compose build && docker-compose up -d**