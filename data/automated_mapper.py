import os
import sys
import pandas as pd
from thefuzz import fuzz
from thefuzz import process

# Add backend to path to import models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app import app
from models import db, Insight, DataPoint, SourceMapping

def map_data_sources(mapping_file_path, external_data_path=None):
    """
    Automates the mapping of data visualizations to source data columns using fuzzy matching.
    Optionally fills in missing source details from an external data list.
    """
    if not os.path.exists(mapping_file_path):
        print(f"Error: File {mapping_file_path} not found.")
        return

    df = pd.read_csv(mapping_file_path).fillna("")
    
    external_df = None
    if external_data_path and os.path.exists(external_data_path):
        try:
            # Handle possible encoding issues with external CSV
            external_df = pd.read_csv(external_data_path, encoding='utf-8-sig').fillna("")
            print(f"Loaded external data source with {len(external_df)} records.")
        except Exception as e:
            print(f"Warning: Could not load external data: {e}")

    with app.app_context():
        for _, row in df.iterrows():
            product = row.get("Product", "").strip()
            tab_name = row.get("Tab Name", "").strip()
            insight_name = row.get("Data Visualization", "").strip()
            viz_calc = row.get("Data Viz Calculation", "").strip()
            data_point_name = row.get("Data Point", "").strip()
            dp_calc = row.get("Data Point Calculation", "").strip()
            
            source_type = row.get("Source Type", "").strip()
            source_db = row.get("Source Data Collection", "").strip()
            source_table = row.get("Source Table", "").strip()
            source_col = row.get("Source Column Name", "").strip()
            source_dtype = row.get("Source Data Type", "").strip()

            # Logic to fill in missing source info if column is blank but data point exists
            if not source_col and data_point_name and external_df is not None:
                # Use fuzzy matching to find the best column name in the external data
                all_cols = external_df['ColumnName'].unique().tolist()
                best_match, score = process.extractOne(data_point_name, all_cols, scorer=fuzz.token_set_ratio)
                
                if score > 85: # High threshold for automated fill
                    match_row = external_df[external_df['ColumnName'] == best_match].iloc[0]
                    source_col = match_row['ColumnName']
                    source_table = match_row['TableName']
                    source_dtype = match_row['DataType']
                    source_db = "AscendGP" # Defaulting for this specific source
                    source_type = "SQL Server" # Defaulting based on dbo schema
                    print(f"Auto-filled source for '{data_point_name}' -> {source_table}.{source_col} (Score: {score})")

            if not insight_name or not data_point_name:
                continue

            if not insight_name or not data_point_name:
                continue

            # Find or Create Insight
            insight = Insight.query.filter_by(insight_name=insight_name).first()
            if not insight:
                insight = Insight(
                    insight_name=insight_name,
                    calculation=viz_calc,
                    products_used_in=[product] if product else []
                )
                db.session.add(insight)
                db.session.flush()
            else:
                # Update products if new
                if product and product not in insight.products_used_in:
                    new_products = list(insight.products_used_in)
                    new_products.append(product)
                    insight.products_used_in = new_products

            # Find or Create DataPoint
            # Note: We use the data point name as the primary identifier for now
            datapoint = DataPoint.query.filter_by(name=data_point_name).first()
            if not datapoint:
                datapoint = DataPoint(
                    name=data_point_name,
                    calculation=dp_calc
                )
                db.session.add(datapoint)
                db.session.flush()

            # Link Insight and DataPoint
            if datapoint not in insight.data_points:
                insight.data_points.append(datapoint)

            # Handle Source Mapping (The actual data resource connection)
            if source_col:
                # Check if this exact mapping already exists
                existing_mapping = SourceMapping.query.filter_by(
                    data_point_id=datapoint.id,
                    source_system=source_type,
                    table=source_table,
                    field=source_col
                ).first()

                if not existing_mapping:
                    # Logic for handling mismatched names can be expanded here
                    # For now, we store exactly what's provided in the mapping sheet
                    new_mapping = SourceMapping(
                        data_point_id=datapoint.id,
                        source_system=source_type,
                        source_name=source_db,
                        table=source_table,
                        field=source_col,
                        data_type=source_dtype
                    )
                    db.session.add(new_mapping)
        
        db.session.commit()
        print("Mapping process completed successfully.")

def suggest_mappings(source_columns, target_data_points):
    """
    Helper function to provide fuzzy match suggestions between source columns 
    and target visualization data points.
    """
    suggestions = {}
    for dp in target_data_points:
        # Find best match in source columns
        match, score = process.extractOne(dp, source_columns, scorer=fuzz.token_set_ratio)
        if score > 70: # Confidence threshold
            suggestions[dp] = {"match": match, "confidence": score}
    return suggestions

if __name__ == "__main__":
    # Path to the primary mapping file
    mapping_file = "data/insight_mapping.csv"
    
    # Path to the external source data list (attached file)
    external_file = "attached_assets/ascendgp_full_data_list_1769446346238.csv"
    
    if not os.path.exists(external_file):
        # Fallback for testing if asset is moved
        external_file = None
        
    map_data_sources(mapping_file, external_file)
