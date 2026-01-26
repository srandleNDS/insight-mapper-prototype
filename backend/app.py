import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Insight, DataPoint, SourceMapping

app = Flask(__name__)
CORS(app)

app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route("/api/insight/search", methods=["GET"])
def search_insight():
    query = request.args.get("q", "")
    if not query:
        return jsonify({"error": "Missing search query ?q="}), 400

    insight = Insight.query.filter(Insight.insight_name.ilike(f"%{query}%")).first()

    if not insight:
        return jsonify({"message": "Insight not found."}), 404

    data_points = []
    for dp in insight.data_points:
        source_mappings = []
        if not dp.source_mappings:
            # Add a placeholder for unmapped data points
            data_points.append({
                "name": dp.name,
                "sourceMapping": [{
                    "sourceName": "UNMAPPED",
                    "sourceSystem": "",
                    "table": "",
                    "field": "",
                    "dataType": "",
                    "isUnmapped": True
                }]
            })
        else:
            for sm in dp.source_mappings:
                source_mappings.append({
                    "sourceName": sm.source_name or "",
                    "sourceSystem": sm.source_system or "",
                    "table": sm.table or "",
                    "field": sm.field or "",
                    "dataType": sm.data_type or "",
                    "isUnmapped": False
                })
            data_points.append({
                "name": dp.name,
                "sourceMapping": source_mappings
            })

    return jsonify({
        "insightName": insight.insight_name,
        "calculation": insight.calculation or "",
        "productsUsedIn": insight.products_used_in or [],
        "dataPoints": data_points
    })

@app.route("/api/insights", methods=["GET"])
def list_insights():
    insights = Insight.query.all()
    return jsonify([{"insightName": i.insight_name} for i in insights])

@app.route("/api/insight/all", methods=["GET"])
def get_all_insights():
    results = []
    insights = Insight.query.all()

    for insight in insights:
        data_points = []
        
        if not insight.data_points:
            data_points.append({
                "name": "N/A",
                "sourceMapping": [{
                    "sourceName": "UNMAPPED",
                    "sourceSystem": "",
                    "table": "",
                    "field": "",
                    "dataType": "",
                    "isUnmapped": True
                }]
            })
        else:
            for dp in insight.data_points:
                source_mappings = []
                if not dp.source_mappings:
                    source_mappings.append({
                        "sourceName": "UNMAPPED",
                        "sourceSystem": "",
                        "table": "",
                        "field": "",
                        "dataType": "",
                        "isUnmapped": True
                    })
                else:
                    for sm in dp.source_mappings:
                        source_mappings.append({
                            "sourceName": sm.source_name or "",
                            "sourceSystem": sm.source_system or "",
                            "table": sm.table or "",
                            "field": sm.field or "",
                            "dataType": sm.data_type or "",
                            "isUnmapped": False
                        })
                data_points.append({
                    "name": dp.name,
                    "sourceMapping": source_mappings
                })

        results.append({
            "id": insight.id,
            "insightName": insight.insight_name,
            "calculation": insight.calculation or "",
            "productsUsedIn": insight.products_used_in or [],
            "dataPoints": data_points
        })

    return jsonify(results)

@app.route("/api/insight/<int:insight_id>", methods=["GET"])
def get_insight_by_id(insight_id):
    insight = Insight.query.get(insight_id)
    
    if not insight:
        return jsonify({"error": "Insight not found"}), 404
    
    data_points = []
    for dp in insight.data_points:
        source_mappings = []
        if not dp.source_mappings:
            source_mappings.append({
                "sourceName": "UNMAPPED",
                "sourceSystem": "",
                "table": "",
                "field": "",
                "dataType": "",
                "isUnmapped": True
            })
        else:
            for sm in dp.source_mappings:
                source_mappings.append({
                    "sourceName": sm.source_name or "",
                    "sourceSystem": sm.source_system or "",
                    "table": sm.table or "",
                    "field": sm.field or "",
                    "dataType": sm.data_type or "",
                    "isUnmapped": False
                })
        data_points.append({
            "name": dp.name,
            "sourceMapping": source_mappings
        })
    
    return jsonify({
        "id": insight.id,
        "insightName": insight.insight_name,
        "calculation": insight.calculation or "",
        "productsUsedIn": insight.products_used_in or [],
        "dataPoints": data_points
    })

if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=8000)
