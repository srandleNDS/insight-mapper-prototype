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

    insight = db.insights.find_one({"insightName": {"$regex": query, "$options": "i"}})

    if not insight:
        return jsonify({"message": "Insight not found."}), 404

    data_points = []
    for dp_name in insight.get("dataPoints", []):
        dp = db.dataPoints.find_one({"name": dp_name})
        if dp:
            data_points.append({
                "name": dp["name"],
                "mappings": dp.get("clientMappings", [])
            })

    return jsonify({
        "insightName": insight["insightName"],
        "calculation": insight["calculation"],
        "productsUsedIn": insight.get("productsUsedIn", []),
        "dataPoints": data_points
    })

@app.route("/api/insights", methods=["GET"])
def list_insights():
    insights = db.insights.find({}, {"insightName": 1, "_id": 0})
    return dumps(insights)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
