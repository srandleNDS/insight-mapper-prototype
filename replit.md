# Insight Mapper

## Overview
A full-stack application for searching and exploring data insights with their data points and source mappings. Features a React frontend and Flask backend connected to PostgreSQL.

## Project Structure
```
/backend        - Flask REST API
  /app.py       - Main API routes
  /models.py    - SQLAlchemy database models
/frontend       - React application
  /src          - React components
  /public       - Static assets
/data           - Data scripts
  /seed_data.py - Database seeding script
```

## Tech Stack
- **Frontend**: React 18, Create React App
- **Backend**: Flask, Flask-SQLAlchemy, Flask-CORS
- **Database**: PostgreSQL

## Running the Application
- Backend runs on port 8000 (localhost)
- Frontend runs on port 5000 (0.0.0.0)
- Frontend proxies API requests to backend

## API Endpoints
- `GET /api/insights` - List all insight names
- `GET /api/insight/search?q=<query>` - Search for specific insight
- `GET /api/insight/all` - Get all insights with full data

## Database Models
- **Insight**: insight_name, calculation, products_used_in
- **DataPoint**: name, calculation
- **SourceMapping**: source_system, source_name, table, field, data_type

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)

## Recent Changes
- Migrated from MongoDB to PostgreSQL for Replit compatibility
- Added sample seed data for demonstration
