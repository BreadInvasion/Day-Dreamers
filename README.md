# DayDreamers Day Planner

The DayDreamer calendar was built to allow easy access to a social calendar experience. Events are shared seamlessly between friends, and updated as needed.

DayDreamer has full internationalization into both German and Chinese (Simplified).

## Basic Architecture
Built on three **Docker** containers:

### Frontend (Javascript)
Webserver and Reverse Proxy: Caddy 2
UI Framework: React.js
Build Tool: CRA (Main branch), Vite (/converttovite branch). Vite is feature complete *except* for an issue with the translation of the react-big-calendar component contents.

### Backend (Python)
API Framework: FastAPI
Enforced Typing: Pydantic

### Database (SQL)
PostgreSQL

## To Launch
Install and run Docker Engine if you don't already have it.

Execute command **docker-compose build && docker-compose up -d**
The website should be accessible at "localhost" in your web browser of choice.
