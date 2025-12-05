import pandas as pd
from pymongo import MongoClient

# === Connect to MongoDB ===
client = MongoClient("mongodb://localhost:27017")
db = client["insight_mapper"]
db.Insights.drop()
db.DataPoints.drop()

# === Load Data from CSV ===
df = pd.read_csv("insight_mapping.csv").fillna("")

# === Build collections ===
insight_dict = {}
data_point_dict = {}

for _, row in df.iterrows():
    # Add to insights
    insight_key = row["Data Visualization"].strip()
    tab = row["Tab Name"].strip()

    if insight_key not in insight_dict:
        insight_dict[insight_key] = {
            "insightName": insight_key,
            "calculation": row["Data Viz Calculation"].strip(),
            "productsUsedIn": [tab],
            "dataPoints": []
        }

    dp = row["Data Point"].strip()
    if dp and dp not in insight_dict[insight_key]["dataPoints"]:
        insight_dict[insight_key]["dataPoints"].append(dp)

    # Add to dataPoints
    if dp:
        if dp not in data_point_dict:
            data_point_dict[dp] = {
                "name": dp,
                "calculation": row["Data Point Calculation"].strip(),
                "dictionaryMapping": {
                    "table": row["Data Dictionary Table"].strip(),
                    "field": row["Data Dictionary Field"].strip(),
                    "dataType": row["DD Data Type"].strip(),
                },
                "sourceMapping": []
            }

        # Only add mapping if system + field provided
        if row["Source Type"].strip() and row["Source Column Name"].strip():
            mapping = {
                "sourceSystem": row["Source Type"].strip(),
                "sourceName": row["Source Data Collection"].strip(),
                "table": row["Source Table"].strip(),
                "field": row["Source Column Name"].strip(),
                "dataType": row["Source Data Type"].strip()
            }
            if mapping not in data_point_dict[dp]["sourceMapping"]:
                data_point_dict[dp]["sourceMapping"].append(mapping)

# === Insert into MongoDB ===
db.Insights.insert_many(insight_dict.values())
db.DataPoints.insert_many(data_point_dict.values())

print("MongoDB collections replaced successfully.")


