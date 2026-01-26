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
                    "sourceType": sm.source_type or "",
                    "ddTable": sm.dd_table or "",
                    "ddField": sm.dd_field or "",
                    "ddType": sm.dd_type or "",
                    "isUnmapped": False
                })
        data_points.append({
            "name": dp.name,
            "entTable": dp.ent_table or "",
            "entField": dp.ent_field or "",
            "entType": dp.ent_type or "",
            "sourceMapping": source_mappings
        })

    return jsonify({
        "id": insight.id,
        "insightName": insight.insight_name,
        "tabName": insight.tab_name or "",
        "calculation": insight.calculation or "",
        "productsUsedIn": insight.products_used_in or [],
        "product": insight.product or "",
        "dataPoints": data_points
    })

@app.route("/api/insights", methods=["GET"])
def list_insights():
    insights = Insight.query.all()
    return jsonify([{"id": i.id, "insightName": i.insight_name, "tabName": i.tab_name} for i in insights])

@app.route("/api/insight/all", methods=["GET"])
def get_all_insights():
    results = []
    insights = Insight.query.all()

    for insight in insights:
        data_points = []
        
        if not insight.data_points:
            data_points.append({
                "name": "N/A",
                "entTable": "",
                "entField": "",
                "entType": "",
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
                            "sourceType": sm.source_type or "",
                            "ddTable": sm.dd_table or "",
                            "ddField": sm.dd_field or "",
                            "ddType": sm.dd_type or "",
                            "isUnmapped": False
                        })
                data_points.append({
                    "name": dp.name,
                    "entTable": dp.ent_table or "",
                    "entField": dp.ent_field or "",
                    "entType": dp.ent_type or "",
                    "sourceMapping": source_mappings
                })

        results.append({
            "id": insight.id,
            "insightName": insight.insight_name,
            "tabName": insight.tab_name or "",
            "calculation": insight.calculation or "",
            "productsUsedIn": insight.products_used_in or [],
            "product": insight.product or "",
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
                    "sourceType": sm.source_type or "",
                    "ddTable": sm.dd_table or "",
                    "ddField": sm.dd_field or "",
                    "ddType": sm.dd_type or "",
                    "isUnmapped": False
                })
        data_points.append({
            "name": dp.name,
            "entTable": dp.ent_table or "",
            "entField": dp.ent_field or "",
            "entType": dp.ent_type or "",
            "sourceMapping": source_mappings
        })
    
    return jsonify({
        "id": insight.id,
        "insightName": insight.insight_name,
        "tabName": insight.tab_name or "",
        "calculation": insight.calculation or "",
        "productsUsedIn": insight.products_used_in or [],
        "product": insight.product or "",
        "dataPoints": data_points
    })

@app.route("/api/stats", methods=["GET"])
def get_stats():
    total_insights = Insight.query.count()
    total_datapoints = DataPoint.query.count()
    total_mappings = SourceMapping.query.count()
    
    unmapped_count = db.session.query(DataPoint).outerjoin(SourceMapping).filter(SourceMapping.id == None).count()
    mapped_count = total_datapoints - unmapped_count
    
    source_systems = db.session.query(SourceMapping.source_system).distinct().all()
    source_systems = [s[0] for s in source_systems if s[0]]
    
    return jsonify({
        "totalVisualizations": total_insights,
        "totalFields": total_datapoints,
        "mappedFields": mapped_count,
        "unmappedFields": unmapped_count,
        "totalMappings": total_mappings,
        "sourceSystems": source_systems
    })

@app.route("/api/tabs", methods=["GET"])
def get_tabs():
    tabs = db.session.query(Insight.tab_name).distinct().all()
    return jsonify([t[0] for t in tabs if t[0]])

@app.route("/api/insight/list", methods=["GET"])
def list_insights_summary():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    tab = request.args.get("tab", None)
    search = request.args.get("search", None)
    incomplete_only = request.args.get("incomplete_only", "false").lower() == "true"
    
    query = Insight.query
    
    if tab:
        query = query.filter(Insight.tab_name == tab)
    
    if search:
        query = query.filter(Insight.insight_name.ilike(f"%{search}%"))
    
    total = query.count()
    insights = query.offset((page - 1) * per_page).limit(per_page).all()
    
    results = []
    for insight in insights:
        total_fields = len(insight.data_points)
        unmapped_fields = sum(1 for dp in insight.data_points if not dp.source_mappings)
        mapped_fields = total_fields - unmapped_fields
        
        if incomplete_only and unmapped_fields == 0:
            continue
        
        results.append({
            "id": insight.id,
            "insightName": insight.insight_name,
            "tabName": insight.tab_name or "",
            "product": insight.product or "",
            "totalFields": total_fields,
            "mappedFields": mapped_fields,
            "unmappedFields": unmapped_fields
        })
    
    return jsonify({
        "data": results,
        "total": total,
        "page": page,
        "perPage": per_page,
        "totalPages": (total + per_page - 1) // per_page
    })

if __name__ == "__main__":
    app.run(debug=True, host="localhost", port=8000)
