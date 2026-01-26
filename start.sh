#!/bin/bash

cd backend && python -c "
import sys
sys.path.insert(0, '.')
from app import app, db
with app.app_context():
    db.create_all()
"

cd ../data && python seed_data.py

cd ../backend && python app.py &
BACKEND_PID=$!

cd ../frontend && npm start &
FRONTEND_PID=$!

wait
