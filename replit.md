# Insight Mapper

## Overview
A full-stack application for searching and exploring data insights with their data points and source mappings. Features a multi-page React frontend with Dashboard, Mappings Explorer, Visualization Detail, Audit, and Bulk Import pages. Connected to Flask backend and PostgreSQL. Populated with data from 11 data dictionary files representing different healthcare systems. Includes AI-powered features via Replit AI Integrations (OpenAI).

## Project Structure
```
/backend              - Flask REST API
  /app.py             - Main API routes (including AI endpoints)
  /models.py          - SQLAlchemy database models
  /ai_service.py      - AI service functions (OpenAI integration)
/frontend             - React application
  /src
    /components
      Layout.jsx      - Global layout with Top Nav and Sidebar
      AiChat.jsx      - Floating AI chat assistant (chat + smart search modes)
    /pages
      Dashboard.jsx   - Overview dashboard with stats
      MappingsExplorer.jsx - Main data grid for visualizations
      VisualizationDetail.jsx - Detail view with tabs and AI features
      AuditPage.jsx   - Audit and changes tracking
      ImportPage.jsx  - Bulk CSV import (product data + source mappings)
      SourceMappingPage.jsx - AI-powered source-to-product mapping
    App.js            - React Router configuration
    index.js          - Entry point
  /public
    index.html        - HTML template with Tailwind CDN
/data                 - Data scripts
  /load_csv_data.py   - CSV data loader for 10 data dictionaries
  /load_ascendgp_data.py - AscendGP Excel data loader
/attached_assets      - Data dictionary CSV and Excel files
```

## Tech Stack
- **Frontend**: React 18, React Router, Tailwind CSS (CDN)
- **Backend**: Flask, Flask-SQLAlchemy, Flask-CORS
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-5 via Replit AI Integrations (no user API key needed)

## AI Features
- **Calculation Explanation**: Explains SQL/data viz calculations in plain English
- **Auto-Mapping Suggestions**: AI suggests source mappings for unmapped fields
- **Natural Language Search**: Search visualizations using conversational queries
- **Lineage Analysis**: AI analyzes data flow, quality concerns, and governance
- **AI Chat Assistant**: Floating chat panel for general data questions

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
3. **Visualization Detail** (`/visualization/:id`) - Tabs: Overview, Fields (with AI Suggest), Lineage (with AI Analysis), Calculations (with AI Explain)
4. **Audit & Changes** (`/audit`) - Track mapping changes and data lineage updates
5. **Bulk Import** (`/import`) - CSV upload for product data and source mappings with preview/validation
6. **AI Source Mapping** (`/source-mapping`) - Upload raw source data, AI predicts mappings to product data points, review and approve

## API Endpoints
- `GET /api/stats` - Get aggregate statistics
- `GET /api/insight/list` - Paginated list of insights (supports ?page, ?per_page, ?search, ?incomplete_only, ?product)
- `GET /api/insight/<id>` - Get single insight with full data points
- `GET /api/insight/all` - Get all insights with full data (large response)
- `GET /api/tabs` - List distinct tab names
- `GET /api/products` - List distinct product names
- `POST /api/ai/explain-calculation` - AI explanation of calculation logic
- `POST /api/ai/suggest-mappings` - AI mapping suggestions for unmapped fields
- `POST /api/ai/search` - Natural language search
- `POST /api/ai/analyze-lineage` - AI lineage analysis
- `POST /api/ai/chat` - General AI chat assistant
- `POST /api/import/preview` - Preview CSV file before import
- `POST /api/import/product` - Import product data (visualizations + data points)
- `POST /api/import/source` - Import source mappings
- `GET /api/import/template/:type` - Download CSV template (product, source, or source-data)
- `POST /api/import/source-upload` - Upload raw source data CSV
- `GET /api/import/source-upload/batches` - List all upload batches
- `GET /api/import/source-upload/:batchId` - Get batch records
- `POST /api/import/source-upload/:batchId/predict` - Run AI mapping prediction
- `POST /api/import/source-upload/approve` - Approve single mapping
- `POST /api/import/source-upload/approve-batch` - Approve all high/medium confidence mappings
- `POST /api/import/source-upload/reject` - Reject a suggested mapping

## Database Models
- **Insight**: id, insight_name, tab_name, calculation, products_used_in, product
- **DataPoint**: id, insight_id, name, ent_table, ent_field, ent_type, calculation
- **SourceMapping**: id, data_point_id, source_system, source_name, table, field, data_type, source_type, dd_table, dd_field, dd_type
- **UploadedSource**: id, source_name, source_type, table_name, column_name, data_type, upload_batch, status, mapped_data_point_id, ai_confidence, ai_reasoning, ai_suggested_data_point_id, ai_suggested_viz_name, ai_suggested_field_name

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Auto-configured by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Auto-configured by Replit AI Integrations

## Recent Changes
- Added AI-powered features: calculation explanation, mapping suggestions, NL search, lineage analysis, chat assistant
- AI service uses Replit AI Integrations (OpenAI GPT-5 model)
- AiChat.jsx floating panel with chat and smart search modes
- VisualizationDetail.jsx enhanced with AI buttons on Fields, Lineage, and Calculations tabs
- Loaded data from 11 data dictionary files including AscendGP (Excel format)
- Added Product filter (server-side) and product breakdown throughout UI
- Added AI Source Mapping page: upload raw source data, AI predicts mappings to existing product data points
- UploadedSource model stores raw source fields with batch tracking
- AI prediction uses GPT-5 to match source fields to enterprise data points by name/type/context similarity
- Approve/reject workflow creates SourceMapping records from approved predictions
