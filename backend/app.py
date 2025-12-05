# Minimal Flask REST API connected to MongoDB for Insight Search

from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.json_util import dumps

app = Flask(__name__)

# Replace with your MongoDB URI
client = MongoClient("mongodb://localhost:27017")
db = client["insight_mapper"]

@app.route("/api/insight/search", methods=["GET"])
def search_insight():
    query = request.args.get("q", "")
    if not query:
        return jsonify({"error": "Missing search query ?q="}), 400

    insight = db.Insights.find_one({"insightName": {"$regex": query, "$options": "i"}})

    if not insight:
        return jsonify({"message": "Insight not found."}), 404

    data_points = []
    for dp_name in insight.get("dataPoints", []):
        dp = db.DataPoints.find_one({"name": dp_name})
        if dp:
            data_points.append({
                "name": dp["name"],
                "sourceMapping": dp.get("sourceMapping", [])
            })

    return jsonify({
        "insightName": insight["insightName"],
        "calculation": insight["calculation"],
        "productsUsedIn": insight.get("productsUsedIn", []),
        "dataPoints": data_points
    })

@app.route("/api/insights", methods=["GET"])
def list_insights():
    cursor = db.Insights.find({}, {"insightName": 1, "_id": 0})
    insights = list(cursor)
    return jsonify(insights)

@app.route("/api/insight/all", methods=["GET"])
def get_all_insights():
    results = []
    insights = db.Insights.find()

    for insight in insights:
        for dp_name in insight.get("dataPoints", []):
            dp = db.DataPoints.find_one({"name": dp_name})
            if dp:
                for mapping in dp.get("sourceMapping", []):
                    results.append({
                        "insightName": insight["insightName"],
                        "calculation": insight["calculation"],
                        "productsUsedIn": insight.get("productsUsedIn", []),
                        "dataPoint": dp["name"],
                        "sourceName": mapping.get("sourceName", ""),
                        "sourceSystem": mapping.get("sourceSystem", ""),
                        "table": mapping.get("table", ""),
                        "field": mapping.get("field", ""),
                        "dataType": mapping.get("dataType", "")
                    })

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
