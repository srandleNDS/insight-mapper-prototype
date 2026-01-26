import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from flask import Flask
from models import db, Insight, DataPoint, SourceMapping

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

sample_data = [
    {
        "insight_name": "Customer Lifetime Value",
        "calculation": "Sum of all purchases - acquisition cost",
        "products_used_in": ["Analytics Dashboard", "Customer Insights"],
        "data_points": [
            {
                "name": "Total Purchases",
                "source_mappings": [
                    {"source_system": "Salesforce", "source_name": "Orders", "table": "orders", "field": "total_amount", "data_type": "decimal"}
                ]
            },
            {
                "name": "Acquisition Cost",
                "source_mappings": [
                    {"source_system": "Marketing DB", "source_name": "Campaigns", "table": "customer_acquisition", "field": "cost", "data_type": "decimal"}
                ]
            }
        ]
    },
    {
        "insight_name": "Monthly Active Users",
        "calculation": "Count of unique users with activity in last 30 days",
        "products_used_in": ["User Analytics", "Executive Dashboard"],
        "data_points": [
            {
                "name": "User Activity",
                "source_mappings": [
                    {"source_system": "App Events", "source_name": "User Actions", "table": "events", "field": "user_id", "data_type": "string"},
                    {"source_system": "Web Analytics", "source_name": "Page Views", "table": "pageviews", "field": "visitor_id", "data_type": "string"}
                ]
            }
        ]
    },
    {
        "insight_name": "Revenue Per User",
        "calculation": "Total Revenue / Active Users",
        "products_used_in": ["Financial Reports", "Growth Dashboard"],
        "data_points": [
            {
                "name": "Total Revenue",
                "source_mappings": [
                    {"source_system": "Billing", "source_name": "Transactions", "table": "payments", "field": "amount", "data_type": "decimal"}
                ]
            },
            {
                "name": "Active User Count",
                "source_mappings": [
                    {"source_system": "Auth System", "source_name": "Sessions", "table": "user_sessions", "field": "user_id", "data_type": "integer"}
                ]
            }
        ]
    }
]

def seed_database():
    with app.app_context():
        db.create_all()
        
        existing = Insight.query.first()
        if existing:
            print("Database already has data. Skipping seed.")
            return
        
        for insight_data in sample_data:
            insight = Insight(
                insight_name=insight_data["insight_name"],
                calculation=insight_data["calculation"],
                products_used_in=insight_data["products_used_in"]
            )
            db.session.add(insight)
            db.session.flush()
            
            for dp_data in insight_data["data_points"]:
                existing_dp = DataPoint.query.filter_by(name=dp_data["name"]).first()
                if not existing_dp:
                    dp = DataPoint(name=dp_data["name"])
                    db.session.add(dp)
                    db.session.flush()
                    
                    for sm_data in dp_data["source_mappings"]:
                        sm = SourceMapping(
                            data_point_id=dp.id,
                            source_system=sm_data["source_system"],
                            source_name=sm_data["source_name"],
                            table=sm_data["table"],
                            field=sm_data["field"],
                            data_type=sm_data["data_type"]
                        )
                        db.session.add(sm)
                else:
                    dp = existing_dp
                
                insight.data_points.append(dp)
        
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
