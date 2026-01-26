# Insight Mapper

## Overview
A full-stack application for searching and exploring data insights with their data points and source mappings. Features a multi-page React frontend with Dashboard, Mappings Explorer, Visualization Detail, and Audit pages. Connected to Flask backend and PostgreSQL.

## Project Structure
```
/backend              - Flask REST API
  /app.py             - Main API routes
  /models.py          - SQLAlchemy database models
/frontend             - React application
  /src
    /components
      Layout.jsx      - Global layout with Top Nav and Sidebar
    /pages
      Dashboard.jsx   - Overview dashboard with stats
      MappingsExplorer.jsx - Main data grid for visualizations
      VisualizationDetail.jsx - Detail view with tabs
      AuditPage.jsx   - Audit and changes tracking
    App.js            - React Router configuration
    index.js          - Entry point
  /public
    index.html        - HTML template with Tailwind CDN
/data                 - Data scripts
  /seed_data.py       - Database seeding script
  /automated_mapper.py - Fuzzy matching mapper
```

## Tech Stack
- **Frontend**: React 18, React Router, Tailwind CSS (CDN)
- **Backend**: Flask, Flask-SQLAlchemy, Flask-CORS
- **Database**: PostgreSQL

## Color Palette
- Primary: #18A69B (teal)
- Background: #f7f7f7
- Cards/Panels: white

## Running the Application
- Backend runs on port 8000 (localhost)
- Frontend runs on port 5000 (0.0.0.0)
- Frontend proxies API requests to backend

## Pages
1. **Dashboard** (`/`) - Overview with stats, recent visualizations, quick actions
2. **Mappings Explorer** (`/explorer`) - Grouped table view with filters
3. **Visualization Detail** (`/visualization/:id`) - Tabs: Overview, Fields, Lineage, Calculations
4. **Audit & Changes** (`/audit`) - Track mapping changes and data lineage updates

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
- Rebuilt entire UI to match wireframe with multi-page React Router app
- Added global layout with Top Nav, Left Sidebar Filters, Main Content
- Created Dashboard, Mappings Explorer, Visualization Detail, Audit pages
- Integrated Tailwind CSS via CDN
- Added filter checkboxes for Tab Name, Filter Context, Source Type
