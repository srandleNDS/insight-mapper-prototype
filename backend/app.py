import os
import csv
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Insight, DataPoint, SourceMapping, UploadedSource

app = Flask(__name__)
CORS(app)

app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a-secret-key"
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
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
    insight = db.session.get(Insight, insight_id)
    
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
    
    products = db.session.query(
        Insight.product, 
        db.func.count(Insight.id)
    ).filter(Insight.product != None, Insight.product != '').group_by(Insight.product).all()
    product_stats = [{"name": p[0], "count": p[1]} for p in products]
    
    return jsonify({
        "totalVisualizations": total_insights,
        "totalFields": total_datapoints,
        "mappedFields": mapped_count,
        "unmappedFields": unmapped_count,
        "totalMappings": total_mappings,
        "sourceSystems": source_systems,
        "products": product_stats
    })

@app.route("/api/products", methods=["GET"])
def get_products():
    products = db.session.query(Insight.product).distinct().all()
    return jsonify([p[0] for p in products if p[0]])

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
    product = request.args.get("product", None)
    incomplete_only = request.args.get("incomplete_only", "false").lower() == "true"
    
    query = Insight.query
    
    if tab:
        tab_list = [t.strip() for t in tab.split(',') if t.strip()]
        if tab_list:
            query = query.filter(Insight.tab_name.in_(tab_list))
    
    if product:
        product_list = [p.strip() for p in product.split(',') if p.strip()]
        if product_list:
            query = query.filter(Insight.product.in_(product_list))
    
    if search:
        query = query.filter(Insight.insight_name.ilike(f"%{search}%"))
    
    if incomplete_only:
        from sqlalchemy import and_
        incomplete_ids = db.session.query(Insight.id).join(DataPoint).outerjoin(SourceMapping).group_by(Insight.id).having(
            db.func.sum(db.case((SourceMapping.id == None, 1), else_=0)) > 0
        ).subquery()
        query = query.filter(Insight.id.in_(db.session.query(incomplete_ids)))

    total = query.count()
    insights = query.offset((page - 1) * per_page).limit(per_page).all()
    
    results = []
    for insight in insights:
        total_fields = len(insight.data_points)
        unmapped_fields = sum(1 for dp in insight.data_points if not dp.source_mappings)
        mapped_fields = total_fields - unmapped_fields
        
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

def _get_json_or_400():
    data = request.get_json(silent=True)
    if data is None:
        return None
    return data


@app.route("/api/ai/explain-calculation", methods=["POST"])
def ai_explain_calculation():
    from ai_service import explain_calculation
    data = _get_json_or_400()
    if data is None:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    calculation = data.get("calculation", "")
    viz_name = data.get("vizName", "")
    data_points = data.get("dataPoints", [])

    if not calculation:
        return jsonify({"error": "No calculation provided"}), 400

    try:
        explanation = explain_calculation(calculation, viz_name, data_points)
        return jsonify({"explanation": explanation})
    except Exception as e:
        app.logger.error(f"AI explain-calculation error: {e}")
        return jsonify({"error": "Failed to generate explanation. Please try again."}), 500


@app.route("/api/ai/suggest-mappings", methods=["POST"])
def ai_suggest_mappings():
    from ai_service import suggest_mappings
    data = _get_json_or_400()
    if data is None:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    unmapped_field = data.get("fieldName", "")
    viz_name = data.get("vizName", "")
    tab_name = data.get("tabName", "")

    if not unmapped_field:
        return jsonify({"error": "No field name provided"}), 400

    existing_mappings = []
    insight = Insight.query.filter_by(insight_name=viz_name).first()
    if insight:
        for dp in insight.data_points:
            for sm in dp.source_mappings:
                existing_mappings.append({
                    "field_name": dp.name,
                    "table": sm.table or "",
                    "column": sm.field or "",
                    "data_type": sm.data_type or ""
                })

    source_tables = []
    tables_query = db.session.query(
        SourceMapping.table,
        db.func.array_agg(db.func.distinct(SourceMapping.field))
    ).filter(SourceMapping.table != None, SourceMapping.table != '').group_by(SourceMapping.table).limit(30).all()

    for t in tables_query:
        source_tables.append({
            "table": t[0],
            "columns": [c for c in t[1] if c] if t[1] else []
        })

    try:
        suggestions = suggest_mappings(unmapped_field, viz_name, tab_name, existing_mappings, source_tables)
        return jsonify(suggestions)
    except Exception as e:
        app.logger.error(f"AI suggest-mappings error: {e}")
        return jsonify({"error": "Failed to generate mapping suggestions. Please try again."}), 500


@app.route("/api/ai/search", methods=["POST"])
def ai_search():
    from ai_service import natural_language_search
    data = _get_json_or_400()
    if data is None:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    query = data.get("query", "")

    if not query:
        return jsonify({"error": "No query provided"}), 400

    tabs = [t[0] for t in db.session.query(Insight.tab_name).distinct().all() if t[0]]
    products = [p[0] for p in db.session.query(Insight.product).distinct().all() if p[0]]

    try:
        search_params = natural_language_search(query, tabs, products)

        search_term = search_params.get("search_term", "")
        product_filter = search_params.get("product_filter", [])
        tab_filter = search_params.get("tab_filter", [])
        incomplete_only = search_params.get("incomplete_only", False)

        q = Insight.query
        if search_term:
            q = q.filter(Insight.insight_name.ilike(f"%{search_term}%"))
        if product_filter:
            q = q.filter(Insight.product.in_(product_filter))
        if tab_filter:
            q = q.filter(Insight.tab_name.in_(tab_filter))

        insights = q.limit(20).all()
        results = []
        for insight in insights:
            total_fields = len(insight.data_points)
            unmapped = sum(1 for dp in insight.data_points if not dp.source_mappings)
            if incomplete_only and unmapped == 0:
                continue
            results.append({
                "id": insight.id,
                "insightName": insight.insight_name,
                "tabName": insight.tab_name or "",
                "product": insight.product or "",
                "totalFields": total_fields,
                "unmappedFields": unmapped,
                "mappedFields": total_fields - unmapped
            })

        return jsonify({
            "explanation": search_params.get("explanation", ""),
            "filters": search_params,
            "results": results
        })
    except Exception as e:
        app.logger.error(f"AI search error: {e}")
        return jsonify({"error": "Failed to process search query. Please try again."}), 500


@app.route("/api/ai/analyze-lineage", methods=["POST"])
def ai_analyze_lineage():
    from ai_service import analyze_lineage
    data = _get_json_or_400()
    if data is None:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    insight_id = data.get("insightId")

    if not insight_id:
        return jsonify({"error": "No insight ID provided"}), 400

    insight = db.session.get(Insight, insight_id)
    if not insight:
        return jsonify({"error": "Insight not found"}), 404

    data_points_with_mappings = []
    for dp in insight.data_points:
        mappings = []
        for sm in dp.source_mappings:
            mappings.append({
                "sourceSystem": sm.source_system or "",
                "table": sm.table or "",
                "field": sm.field or "",
                "dataType": sm.data_type or "",
                "sourceType": sm.source_type or ""
            })
        data_points_with_mappings.append({
            "name": dp.name,
            "entTable": dp.ent_table or "",
            "entField": dp.ent_field or "",
            "sourceMappings": mappings
        })

    try:
        analysis = analyze_lineage(insight.insight_name, data_points_with_mappings)
        return jsonify({"analysis": analysis})
    except Exception as e:
        app.logger.error(f"AI analyze-lineage error: {e}")
        return jsonify({"error": "Failed to analyze lineage. Please try again."}), 500


@app.route("/api/ai/chat", methods=["POST"])
def ai_chat_endpoint():
    from ai_service import ai_chat
    data = _get_json_or_400()
    if data is None:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    message = data.get("message", "")

    if not message:
        return jsonify({"error": "No message provided"}), 400

    total_insights = Insight.query.count()
    total_datapoints = DataPoint.query.count()
    unmapped_count = db.session.query(DataPoint).outerjoin(SourceMapping).filter(SourceMapping.id == None).count()
    mapped_count = total_datapoints - unmapped_count
    products = [p[0] for p in db.session.query(Insight.product).distinct().all() if p[0]]
    source_systems = [s[0] for s in db.session.query(SourceMapping.source_system).distinct().all() if s[0]]

    context = {
        "totalVisualizations": total_insights,
        "totalFields": total_datapoints,
        "mappedFields": mapped_count,
        "unmappedFields": unmapped_count,
        "products": products,
        "sourceSystems": source_systems
    }

    try:
        response = ai_chat(message, context)
        return jsonify({"response": response})
    except Exception as e:
        app.logger.error(f"AI chat error: {e}")
        return jsonify({"error": "Failed to process your message. Please try again."}), 500


PRODUCT_REQUIRED_FIELDS = ['Product', 'Tab Name', 'Data Visualization']

SOURCE_REQUIRED_FIELDS = ['Product', 'Tab Name', 'Data Visualization', 'Source Type', 'Source Data Collection', 'Source Table']

PRODUCT_RECOGNIZED_COLUMNS = [
    'Product', 'Tab Name', 'Data Visualization', 'Data Viz Calculation',
    'Enterprise Data Dictionary Table', 'Enterprise Data Dictionary Field',
    'Enterprise DD Data Type', 'Enterprise DD Table', 'Enterprise DD Field',
    'Data Point', 'Data Point Calculation',
    'Data Dictionary Table', 'Data Dictionary Field', 'DD Data Type',
    'Source Type', 'Source Data Collection', 'Source Table',
    'Source Column Name', 'Source Data Type'
]

SOURCE_RECOGNIZED_COLUMNS = [
    'Product', 'Tab Name', 'Data Visualization',
    'Enterprise Data Dictionary Table', 'Enterprise Data Dictionary Field',
    'Enterprise DD Data Type', 'Enterprise DD Table', 'Enterprise DD Field',
    'Data Point', 'Data Point Calculation', 'Data Point Field',
    'Data Dictionary Table', 'Data Dictionary Field', 'DD Data Type',
    'Source System', 'Source Type', 'Source Data Collection',
    'Source Table', 'Source Column Name', 'Source Column',
    'Source Data Type'
]


def _get_field(row, *keys):
    for key in keys:
        val = row.get(key, '').strip()
        if val:
            return val
    return ''


def _parse_csv_upload(file_storage):
    try:
        content = file_storage.read().decode('utf-8-sig')
    except UnicodeDecodeError:
        file_storage.seek(0)
        content = file_storage.read().decode('latin-1')
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    columns = [c for c in (reader.fieldnames or []) if c and c.strip()]
    return rows, columns


def _check_required_columns(columns, required):
    return [c for c in required if c not in columns]


@app.route("/api/import/preview", methods=["POST"])
def import_preview():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    import_type = request.form.get('type', 'product')

    if not file.filename.lower().endswith('.csv'):
        return jsonify({"error": "Only CSV files are supported"}), 400

    rows, columns = _parse_csv_upload(file)

    if import_type == 'product':
        required = PRODUCT_REQUIRED_FIELDS
        recognized = PRODUCT_RECOGNIZED_COLUMNS
    else:
        required = SOURCE_REQUIRED_FIELDS
        recognized = SOURCE_RECOGNIZED_COLUMNS

    missing_required = _check_required_columns(columns, required)
    matched = [c for c in columns if c in recognized]

    preview_rows = rows[:10]

    products = list(set(r.get('Product', '').strip() for r in rows if r.get('Product', '').strip()))
    viz_names = list(set(r.get('Data Visualization', '').strip() for r in rows if r.get('Data Visualization', '').strip()))

    return jsonify({
        "totalRows": len(rows),
        "columns": columns,
        "expectedColumns": required,
        "recognizedColumns": recognized,
        "matchedColumns": matched,
        "missingColumns": missing_required,
        "preview": preview_rows,
        "products": sorted(products),
        "visualizations": len(viz_names),
        "valid": len(missing_required) == 0
    })


@app.route("/api/import/product", methods=["POST"])
def import_product_data():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if not file.filename.lower().endswith('.csv'):
        return jsonify({"error": "Only CSV files are supported"}), 400

    rows, columns = _parse_csv_upload(file)
    missing = _check_required_columns(columns, PRODUCT_REQUIRED_FIELDS)
    if missing:
        return jsonify({"error": f"Missing required columns: {', '.join(missing)}"}), 400

    insights_created = 0
    insights_updated = 0
    datapoints_created = 0
    source_mappings_created = 0
    errors = []

    insights_cache = {}

    try:
        for i, row in enumerate(rows):
            product = row.get('Product', '').strip()
            tab_name = row.get('Tab Name', '').strip()
            viz_name = row.get('Data Visualization', '').strip()
            viz_calc = row.get('Data Viz Calculation', '').strip()
            ent_table = _get_field(row, 'Enterprise Data Dictionary Table', 'Enterprise DD Table')
            ent_field = _get_field(row, 'Enterprise Data Dictionary Field', 'Enterprise DD Field', 'Data Point')
            ent_type = _get_field(row, 'Enterprise DD Data Type')
            dp_calc = _get_field(row, 'Data Point Calculation')
            dd_table = _get_field(row, 'Data Dictionary Table')
            dd_field = _get_field(row, 'Data Dictionary Field')
            dd_type = _get_field(row, 'DD Data Type')
            src_type = _get_field(row, 'Source Type')
            src_collection = _get_field(row, 'Source Data Collection')
            src_table = _get_field(row, 'Source Table')
            src_column = _get_field(row, 'Source Column Name', 'Source Column')
            src_data_type = _get_field(row, 'Source Data Type')

            if not viz_name:
                errors.append(f"Row {i+2}: Missing Data Visualization name")
                continue

            dp_name = ent_field or dd_field
            if not dp_name:
                errors.append(f"Row {i+2}: Missing data point field name")
                continue

            cache_key = (viz_name, product)
            if cache_key in insights_cache:
                insight = insights_cache[cache_key]
            else:
                insight = Insight.query.filter_by(
                    insight_name=viz_name, product=product
                ).first()

                if not insight:
                    insight = Insight(
                        insight_name=viz_name,
                        tab_name=tab_name,
                        calculation=viz_calc,
                        products_used_in=[tab_name] if tab_name else [],
                        product=product
                    )
                    db.session.add(insight)
                    db.session.flush()
                    insights_created += 1
                else:
                    if viz_calc and not insight.calculation:
                        insight.calculation = viz_calc
                    if tab_name and not insight.tab_name:
                        insight.tab_name = tab_name
                    insights_updated += 1

                insights_cache[cache_key] = insight

            existing_dp = DataPoint.query.filter_by(
                insight_id=insight.id, name=dp_name
            ).first()

            if not existing_dp:
                dp = DataPoint(
                    insight_id=insight.id,
                    name=dp_name,
                    ent_table=ent_table,
                    ent_field=ent_field,
                    ent_type=ent_type,
                    calculation=dp_calc
                )
                db.session.add(dp)
                db.session.flush()
                datapoints_created += 1
            else:
                dp = existing_dp

            if src_table or src_column or dd_table or dd_field:
                existing_sm = SourceMapping.query.filter_by(
                    data_point_id=dp.id,
                    source_system=src_collection,
                    table=src_table or ent_table,
                    field=src_column or ent_field
                ).first()
                if not existing_sm:
                    sm = SourceMapping(
                        data_point_id=dp.id,
                        source_system=src_collection,
                        source_name=src_column or dd_field,
                        table=src_table or ent_table,
                        field=src_column or ent_field,
                        data_type=src_data_type or dd_type or ent_type,
                        source_type=src_type,
                        dd_table=dd_table,
                        dd_field=dd_field,
                        dd_type=dd_type
                    )
                    db.session.add(sm)
                    source_mappings_created += 1

        db.session.commit()

        return jsonify({
            "success": True,
            "insightsCreated": insights_created,
            "insightsUpdated": insights_updated,
            "dataPointsCreated": datapoints_created,
            "sourceMappingsCreated": source_mappings_created,
            "errors": errors[:20],
            "totalRows": len(rows)
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Product import error: {e}")
        return jsonify({"error": "Import failed. Database has been rolled back."}), 500


@app.route("/api/import/source", methods=["POST"])
def import_source_data():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if not file.filename.lower().endswith('.csv'):
        return jsonify({"error": "Only CSV files are supported"}), 400

    rows, columns = _parse_csv_upload(file)
    missing = _check_required_columns(columns, SOURCE_REQUIRED_FIELDS)
    if missing:
        return jsonify({"error": f"Missing required columns: {', '.join(missing)}"}), 400

    mappings_created = 0
    skipped = 0
    errors = []

    try:
        for i, row in enumerate(rows):
            product = row.get('Product', '').strip()
            viz_name = row.get('Data Visualization', '').strip()
            dp_field = _get_field(row, 'Data Point Field', 'Enterprise Data Dictionary Field', 'Enterprise DD Field', 'Data Point', 'Data Dictionary Field')
            src_system = _get_field(row, 'Source System', 'Source Data Collection')
            src_type = _get_field(row, 'Source Type')
            src_collection = _get_field(row, 'Source Data Collection')
            src_table = _get_field(row, 'Source Table')
            src_column = _get_field(row, 'Source Column Name', 'Source Column')
            src_data_type = _get_field(row, 'Source Data Type')
            dd_table = _get_field(row, 'DD Table', 'Data Dictionary Table')
            dd_field = _get_field(row, 'DD Field', 'Data Dictionary Field')
            dd_type = _get_field(row, 'DD Data Type', 'DD Type')

            if not viz_name or not dp_field:
                errors.append(f"Row {i+2}: Missing Data Visualization or Data Point Field")
                continue

            insight = Insight.query.filter_by(
                insight_name=viz_name, product=product
            ).first()
            if not insight:
                insight = Insight.query.filter_by(insight_name=viz_name).first()

            if not insight:
                errors.append(f"Row {i+2}: Visualization '{viz_name}' not found")
                continue

            data_point = DataPoint.query.filter_by(
                insight_id=insight.id, name=dp_field
            ).first()

            if not data_point:
                errors.append(f"Row {i+2}: Data point '{dp_field}' not found in '{viz_name}'")
                continue

            existing = SourceMapping.query.filter_by(
                data_point_id=data_point.id,
                source_system=src_system or src_collection,
                table=src_table,
                field=src_column
            ).first()

            if existing:
                skipped += 1
                continue

            sm = SourceMapping(
                data_point_id=data_point.id,
                source_system=src_system or src_collection,
                source_name=src_column or dd_field,
                table=src_table,
                field=src_column,
                data_type=src_data_type or dd_type,
                source_type=src_type,
                dd_table=dd_table,
                dd_field=dd_field,
                dd_type=dd_type
            )
            db.session.add(sm)
            mappings_created += 1

        db.session.commit()

        return jsonify({
            "success": True,
            "mappingsCreated": mappings_created,
            "skipped": skipped,
            "errors": errors[:20],
            "totalRows": len(rows)
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Source import error: {e}")
        return jsonify({"error": "Import failed. Database has been rolled back."}), 500


SOURCE_UPLOAD_COLUMNS = ['Source Name', 'Source Type', 'Table', 'Column', 'Data Type']


@app.route("/api/import/source-upload", methods=["POST"])
def upload_raw_source():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if not file.filename.lower().endswith('.csv'):
        return jsonify({"error": "Only CSV files are supported"}), 400

    rows, columns = _parse_csv_upload(file)

    col_map = {}
    for col in columns:
        cl = col.lower().strip()
        if cl in ('source name', 'source_name', 'source system', 'source'):
            col_map['source_name'] = col
        elif cl in ('source type', 'source_type', 'type'):
            col_map['source_type'] = col
        elif cl in ('table', 'table name', 'table_name', 'source table'):
            col_map['table_name'] = col
        elif cl in ('column', 'column name', 'column_name', 'source column', 'source column name', 'field', 'field name'):
            col_map['column_name'] = col
        elif cl in ('data type', 'data_type', 'datatype', 'source data type'):
            col_map['data_type'] = col

    if 'source_name' not in col_map or 'table_name' not in col_map or 'column_name' not in col_map:
        missing = []
        if 'source_name' not in col_map:
            missing.append('Source Name')
        if 'table_name' not in col_map:
            missing.append('Table')
        if 'column_name' not in col_map:
            missing.append('Column')
        return jsonify({"error": f"Missing required columns: {', '.join(missing)}. Found columns: {', '.join(columns)}"}), 400

    import uuid
    batch_id = str(uuid.uuid4())[:8]
    records_created = 0

    try:
        for i, row in enumerate(rows):
            src_name = row.get(col_map['source_name'], '').strip()
            src_type = row.get(col_map.get('source_type', ''), '').strip() if 'source_type' in col_map else ''
            tbl = row.get(col_map['table_name'], '').strip()
            col_name = row.get(col_map['column_name'], '').strip()
            d_type = row.get(col_map.get('data_type', ''), '').strip() if 'data_type' in col_map else ''

            if not src_name or not col_name:
                continue

            us = UploadedSource(
                source_name=src_name,
                source_type=src_type,
                table_name=tbl,
                column_name=col_name,
                data_type=d_type,
                upload_batch=batch_id,
                status='pending'
            )
            db.session.add(us)
            records_created += 1

        db.session.commit()

        return jsonify({
            "success": True,
            "batchId": batch_id,
            "recordsCreated": records_created,
            "totalRows": len(rows)
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Source upload error: {e}")
        return jsonify({"error": "Upload failed"}), 500


@app.route("/api/import/source-upload/batches")
def list_source_batches():
    batches = db.session.query(
        UploadedSource.upload_batch,
        UploadedSource.source_name,
        db.func.count(UploadedSource.id).label('total'),
        db.func.count(db.case(
            (UploadedSource.status == 'pending', 1)
        )).label('pending'),
        db.func.count(db.case(
            (UploadedSource.status == 'suggested', 1)
        )).label('suggested'),
        db.func.count(db.case(
            (UploadedSource.status == 'approved', 1)
        )).label('approved'),
        db.func.count(db.case(
            (UploadedSource.status == 'no_match', 1)
        )).label('no_match'),
    ).group_by(UploadedSource.upload_batch, UploadedSource.source_name).all()

    result = {}
    for row in batches:
        bid = row.upload_batch
        if bid not in result:
            result[bid] = {"batchId": bid, "sources": [], "total": 0, "pending": 0, "suggested": 0, "approved": 0, "noMatch": 0}
        result[bid]["sources"].append(row.source_name)
        result[bid]["total"] += row.total
        result[bid]["pending"] += row.pending
        result[bid]["suggested"] += row.suggested
        result[bid]["approved"] += row.approved
        result[bid]["noMatch"] += row.no_match

    for bid in result:
        result[bid]["sources"] = list(set(result[bid]["sources"]))

    return jsonify(list(result.values()))


@app.route("/api/import/source-upload/<batch_id>")
def get_source_batch(batch_id):
    records = UploadedSource.query.filter_by(upload_batch=batch_id).all()
    items = []
    for r in records:
        item = {
            "id": r.id,
            "sourceName": r.source_name,
            "sourceType": r.source_type,
            "tableName": r.table_name,
            "columnName": r.column_name,
            "dataType": r.data_type,
            "status": r.status,
            "aiConfidence": r.ai_confidence,
            "aiReasoning": r.ai_reasoning,
            "aiSuggestedDataPointId": r.ai_suggested_data_point_id,
            "aiSuggestedVizName": r.ai_suggested_viz_name,
            "aiSuggestedFieldName": r.ai_suggested_field_name,
        }
        items.append(item)
    return jsonify(items)


@app.route("/api/import/source-upload/<batch_id>/predict", methods=["POST"])
def predict_batch_mappings(batch_id):
    from ai_service import predict_source_mappings

    records = UploadedSource.query.filter_by(upload_batch=batch_id, status='pending').all()
    if not records:
        return jsonify({"error": "No pending records in this batch"}), 400

    source_fields = []
    for r in records:
        source_fields.append({
            "id": r.id,
            "source_name": r.source_name,
            "source_type": r.source_type or '',
            "table_name": r.table_name or '',
            "column_name": r.column_name or '',
            "data_type": r.data_type or ''
        })

    data_points = db.session.query(
        DataPoint.id,
        DataPoint.name,
        DataPoint.ent_table,
        DataPoint.ent_field,
        DataPoint.ent_type,
        Insight.insight_name
    ).join(Insight).limit(200).all()

    dp_list = []
    for dp in data_points:
        dp_list.append({
            "id": dp.id,
            "name": dp.name,
            "ent_table": dp.ent_table or '',
            "ent_field": dp.ent_field or '',
            "ent_type": dp.ent_type or '',
            "viz_name": dp.insight_name
        })

    try:
        chunk_size = 30
        all_ai_mappings = []
        summary = ""

        for i in range(0, len(source_fields), chunk_size):
            chunk = source_fields[i:i+chunk_size]
            ai_result = predict_source_mappings(chunk, dp_list)
            all_ai_mappings.extend(ai_result.get("mappings", []))
            if ai_result.get("summary"):
                summary = ai_result["summary"]

        mapping_lookup = {}
        for m in all_ai_mappings:
            key = (m.get("source_table", ""), m.get("source_column", ""))
            if key not in mapping_lookup:
                mapping_lookup[key] = m

        valid_dp_ids = set(dp['id'] for dp in dp_list)

        matched = 0
        for r in records:
            key = (r.table_name, r.column_name)
            m = mapping_lookup.get(key)
            suggested_id = m.get("matched_data_point_id") if m else None
            if suggested_id and suggested_id in valid_dp_ids:
                r.ai_suggested_data_point_id = suggested_id
                r.ai_suggested_viz_name = m.get("matched_viz_name", "")
                r.ai_suggested_field_name = m.get("matched_field_name", "")
                r.ai_confidence = m.get("confidence", "low")
                r.ai_reasoning = m.get("reasoning", "")
                r.status = 'suggested'
                matched += 1
            else:
                r.ai_confidence = m.get("confidence", "none") if m else "none"
                r.ai_reasoning = m.get("reasoning", "No matching data point found") if m else "No matching data point found"
                r.status = 'no_match'

        db.session.commit()

        return jsonify({
            "success": True,
            "totalProcessed": len(records),
            "matched": matched,
            "unmatched": len(records) - matched,
            "summary": summary
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"AI prediction error: {e}")
        return jsonify({"error": "AI prediction failed. Please try again."}), 500


@app.route("/api/import/source-upload/approve", methods=["POST"])
def approve_mapping():
    data = _get_json_or_400()
    if isinstance(data, tuple):
        return data

    record_id = data.get("recordId")
    data_point_id = data.get("dataPointId")

    record = UploadedSource.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404

    dp = DataPoint.query.get(data_point_id)
    if not dp:
        return jsonify({"error": "Data point not found"}), 404

    existing = SourceMapping.query.filter_by(
        data_point_id=dp.id,
        source_system=record.source_name,
        table=record.table_name,
        field=record.column_name
    ).first()

    if existing:
        record.status = 'approved'
        record.mapped_data_point_id = dp.id
        db.session.commit()
        return jsonify({"success": True, "message": "Mapping already exists, record marked as approved"})

    sm = SourceMapping(
        data_point_id=dp.id,
        source_system=record.source_name,
        source_name=record.column_name,
        table=record.table_name,
        field=record.column_name,
        data_type=record.data_type,
        source_type=record.source_type
    )
    db.session.add(sm)
    record.status = 'approved'
    record.mapped_data_point_id = dp.id
    db.session.commit()

    return jsonify({"success": True, "message": "Mapping created and approved"})


@app.route("/api/import/source-upload/approve-batch", methods=["POST"])
def approve_batch_mappings():
    data = _get_json_or_400()
    if isinstance(data, tuple):
        return data

    record_ids = data.get("recordIds", [])
    if not record_ids:
        return jsonify({"error": "No records specified"}), 400

    approved = 0
    skipped = 0
    errors = []

    for rid in record_ids:
        record = UploadedSource.query.get(rid)
        if not record or not record.ai_suggested_data_point_id:
            skipped += 1
            continue

        dp = DataPoint.query.get(record.ai_suggested_data_point_id)
        if not dp:
            errors.append(f"Data point {record.ai_suggested_data_point_id} not found for record {rid}")
            continue

        existing = SourceMapping.query.filter_by(
            data_point_id=dp.id,
            source_system=record.source_name,
            table=record.table_name,
            field=record.column_name
        ).first()

        if not existing:
            sm = SourceMapping(
                data_point_id=dp.id,
                source_system=record.source_name,
                source_name=record.column_name,
                table=record.table_name,
                field=record.column_name,
                data_type=record.data_type,
                source_type=record.source_type
            )
            db.session.add(sm)

        record.status = 'approved'
        record.mapped_data_point_id = dp.id
        approved += 1

    db.session.commit()

    return jsonify({
        "success": True,
        "approved": approved,
        "skipped": skipped,
        "errors": errors
    })


@app.route("/api/import/source-upload/reject", methods=["POST"])
def reject_mapping():
    data = _get_json_or_400()
    if isinstance(data, tuple):
        return data

    record_id = data.get("recordId")
    record = UploadedSource.query.get(record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404

    record.status = 'rejected'
    record.ai_suggested_data_point_id = None
    record.ai_suggested_viz_name = None
    record.ai_suggested_field_name = None
    db.session.commit()

    return jsonify({"success": True})


@app.route("/api/import/template/<template_type>")
def download_template(template_type):
    if template_type == 'product':
        columns = [
            'Product', 'Tab Name', 'Data Visualization', 'Data Viz Calculation',
            'Enterprise Data Dictionary Table', 'Enterprise Data Dictionary Field',
            'Enterprise DD Data Type', 'Data Point Calculation',
            'Data Dictionary Table', 'Data Dictionary Field', 'DD Data Type',
            'Source Type', 'Source Data Collection', 'Source Table',
            'Source Column Name', 'Source Data Type'
        ]
        example = ['InsightFlow', 'Dashboard', 'Total Revenue', 'SUM(Revenue)',
                   'fact_revenue', 'total_amount', 'decimal', '',
                   'dbo.Revenue', 'TotalRevenue', 'money',
                   'PMS', 'WebPT', 'billing', 'total_charge', 'decimal']
    elif template_type == 'source':
        columns = [
            'Product', 'Tab Name', 'Data Visualization',
            'Enterprise Data Dictionary Field', 'Source Type',
            'Source Data Collection', 'Source Table', 'Source Column Name',
            'Source Data Type', 'Data Dictionary Table', 'Data Dictionary Field',
            'DD Data Type'
        ]
        example = ['InsightFlow', 'Dashboard', 'Total Revenue',
                   'total_amount', 'PMS', 'WebPT', 'billing',
                   'total_charge', 'decimal', 'dbo.Billing', 'TotalCharge', 'money']
    elif template_type == 'source-data':
        columns = ['Source Name', 'Source Type', 'Table', 'Column', 'Data Type']
        example = ['WebPT', 'PMS', 'billing', 'total_charge', 'decimal']
    else:
        return jsonify({"error": "Invalid template type"}), 400

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(columns)
    writer.writerow(example)
    
    from flask import Response
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={template_type}_import_template.csv'}
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
