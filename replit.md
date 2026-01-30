# Insight Mapper

## Overview
A full-stack application for searching and exploring data insights with their data points and source mappings. Features a multi-page React frontend with Dashboard, Mappings Explorer, Visualization Detail, and Audit pages. Connected to Flask backend and PostgreSQL. Populated with data from 10 data dictionary CSV files representing different healthcare systems.

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
  /load_csv_data.py   - CSV data loader for 10 data dictionaries
/attached_assets      - Data dictionary CSV files
```

## Tech Stack
- **Frontend**: React 18, React Router, Tailwind CSS (CDN)
- **Backend**: Flask, Flask-SQLAlchemy, Flask-CORS
- **Database**: PostgreSQL

## Data Sources
The application uses 11 data dictionary files:
- WebPT, WinOMS, WSC, DenialIQ, Dentrix, DSN, HCHB, PrimaryCare-Aprima, PrimaryCare-Ethizo, Waystar, AscendGP

Current database statistics:
- 1,098 visualizations
- 6,295 data points (fields)
- 6,088 mapped fields
- 207 unmapped fields
- 20,852 source mappings

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
2. **Mappings Explorer** (`/explorer`) - Paginated table view with filters
3. **Visualization Detail** (`/visualization/:id`) - Tabs: Overview, Fields, Lineage, Calculations
4. **Audit & Changes** (`/audit`) - Track mapping changes and data lineage updates

## API Endpoints
- `GET /api/stats` - Get aggregate statistics
- `GET /api/insight/list` - Paginated list of insights (supports ?page, ?per_page, ?search, ?incomplete_only)
- `GET /api/insight/<id>` - Get single insight with full data points
- `GET /api/insight/all` - Get all insights with full data (large response)
- `GET /api/tabs` - List distinct tab names

## Database Models
- **Insight**: id, insight_name, tab_name, calculation, products_used_in, product
- **DataPoint**: id, insight_id, name, ent_table, ent_field, ent_type, calculation
- **SourceMapping**: id, data_point_id, source_system, source_name, table, field, data_type, source_type, dd_table, dd_field, dd_type

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)

## Recent Changes
- Loaded data from 10 data dictionary CSV files (WebPT, WinOMS, WSC, DenialIQ, Dentrix, DSN, HCHB, PrimaryCare-Aprima, PrimaryCare-Ethizo, Waystar)
- Added optimized paginated API endpoints for performance
- Updated database models to store enterprise and data dictionary field information
- Frontend now uses efficient lazy-loading for visualization details
