import os
import sys
import csv
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from models import db, Insight, DataPoint, SourceMapping
from app import app

CSV_FILES = [
    ('attached_assets/data_dictionary(WebPT)_1769463606893.csv', 'WebPT'),
    ('attached_assets/data_dictionary(WinOMS-Mapping)_1769463606893.csv', 'WinOMS'),
    ('attached_assets/data_dictionary(WSC)_1769463606894.csv', 'WSC'),
    ('attached_assets/data_dictionary(DenialIQ)_1769463606894.csv', 'DenialIQ'),
    ('attached_assets/data_dictionary(Dentrix-Mapping)_1769463606895.csv', 'Dentrix'),
    ('attached_assets/data_dictionary(DSN-Mapping)_1769463606896.csv', 'DSN'),
    ('attached_assets/data_dictionary(HCHB)_1769463606897.csv', 'HCHB'),
    ('attached_assets/data_dictionary(PrimaryCare-Aprima)_1769463606898.csv', 'PrimaryCare-Aprima'),
    ('attached_assets/data_dictionary(PrimaryCare-Ethizo)_1769463606899.csv', 'PrimaryCare-Ethizo'),
    ('attached_assets/data_dictionary(Waystar)_1769463606899.csv', 'Waystar'),
]

def read_csv_with_encoding(filepath):
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc, errors='replace') as f:
                content = f.read()
                content = content.replace('\r\n', '\n').replace('\r', '\n')
                lines = content.strip().split('\n')
                reader = csv.DictReader(lines)
                return list(reader)
        except Exception as e:
            continue
    return []

def load_all_data():
    insights_map = {}
    
    for filepath, default_source in CSV_FILES:
        print(f"Processing {default_source}...")
        
        if not os.path.exists(filepath):
            print(f"  File not found: {filepath}")
            continue
            
        rows = read_csv_with_encoding(filepath)
        print(f"  Found {len(rows)} rows")
        
        for row in rows:
            product = row.get('Product', '').strip()
            tab_name = row.get('Tab Name', '').strip()
            viz_name = row.get('Data Visualization', '').strip()
            viz_calc = row.get('Data Viz Calculation', '').strip()
            
            ent_table = row.get('Enterprise Data Dictionary Table', '').strip()
            ent_field = row.get('Enterprise Data Dictionary Field', '').strip()
            ent_type = row.get('Enterprise DD Data Type', '').strip()
            
            dp_calc = row.get('Data Point Calculation', '').strip()
            dd_table = row.get('Data Dictionary Table', '').strip()
            dd_field = row.get('Data Dictionary Field', '').strip()
            dd_type = row.get('DD Data Type', '').strip()
            
            src_type = row.get('Source Type', '').strip()
            src_collection = row.get('Source Data Collection', '').strip()
            src_table = row.get('Source Table', '').strip()
            src_column = row.get('Source Column Name', '').strip()
            src_data_type = row.get('Source Data Type', '').strip()
            
            if not viz_name:
                continue
            
            insight_key = (viz_name, tab_name)
            if insight_key not in insights_map:
                insights_map[insight_key] = {
                    'insight_name': viz_name,
                    'tab_name': tab_name,
                    'calculation': viz_calc,
                    'products_used_in': [tab_name] if tab_name else [],
                    'product': product,
                    'data_points': {}
                }
            else:
                if tab_name and tab_name not in insights_map[insight_key]['products_used_in']:
                    insights_map[insight_key]['products_used_in'].append(tab_name)
            
            dp_name = ent_field if ent_field else dd_field
            if not dp_name:
                continue
            
            dp_key = dp_name
            if dp_key not in insights_map[insight_key]['data_points']:
                insights_map[insight_key]['data_points'][dp_key] = {
                    'name': dp_name,
                    'ent_table': ent_table,
                    'ent_field': ent_field,
                    'ent_type': ent_type,
                    'calculation': dp_calc,
                    'source_mappings': []
                }
            
            if src_table or src_column or dd_table or dd_field:
                mapping = {
                    'source_system': src_collection or default_source,
                    'source_name': src_column or dd_field,
                    'table': src_table or ent_table,
                    'field': src_column or ent_field,
                    'data_type': src_data_type or dd_type or ent_type,
                    'source_type': src_type,
                    'dd_table': dd_table,
                    'dd_field': dd_field,
                    'dd_type': dd_type
                }
                
                existing = insights_map[insight_key]['data_points'][dp_key]['source_mappings']
                mapping_key = (mapping['source_system'], mapping['table'], mapping['field'])
                if not any((m['source_system'], m['table'], m['field']) == mapping_key for m in existing):
                    existing.append(mapping)
    
    print(f"\nTotal insights: {len(insights_map)}")
    total_dp = sum(len(i['data_points']) for i in insights_map.values())
    print(f"Total data points: {total_dp}")
    
    return insights_map

def seed_database(insights_map):
    with app.app_context():
        print("\nDropping and recreating tables...")
        db.drop_all()
        db.create_all()
        
        print("Creating insights...")
        mapped_count = 0
        unmapped_count = 0
        
        for insight_key, data in insights_map.items():
            insight = Insight(
                insight_name=data['insight_name'],
                tab_name=data['tab_name'],
                calculation=data['calculation'],
                products_used_in=data['products_used_in'],
                product=data['product']
            )
            db.session.add(insight)
            db.session.flush()
            
            for dp_key, dp_data in data['data_points'].items():
                data_point = DataPoint(
                    name=dp_data['name'],
                    insight_id=insight.id,
                    ent_table=dp_data['ent_table'],
                    ent_field=dp_data['ent_field'],
                    ent_type=dp_data['ent_type'],
                    calculation=dp_data['calculation']
                )
                db.session.add(data_point)
                db.session.flush()
                
                if dp_data['source_mappings']:
                    for mapping in dp_data['source_mappings']:
                        sm = SourceMapping(
                            source_system=mapping['source_system'],
                            source_name=mapping['source_name'],
                            table=mapping['table'],
                            field=mapping['field'],
                            data_type=mapping['data_type'],
                            source_type=mapping['source_type'],
                            dd_table=mapping['dd_table'],
                            dd_field=mapping['dd_field'],
                            dd_type=mapping['dd_type'],
                            data_point_id=data_point.id
                        )
                        db.session.add(sm)
                    mapped_count += 1
                else:
                    unmapped_count += 1
        
        db.session.commit()
        
        total_insights = Insight.query.count()
        total_datapoints = DataPoint.query.count()
        total_mappings = SourceMapping.query.count()
        
        print(f"\n=== Database Summary ===")
        print(f"Total Insights: {total_insights}")
        print(f"Total Data Points: {total_datapoints}")
        print(f"Total Source Mappings: {total_mappings}")
        print(f"Mapped Data Points: {mapped_count}")
        print(f"Unmapped Data Points: {unmapped_count}")

if __name__ == '__main__':
    print("Loading CSV data from 10 data dictionary files...")
    insights_map = load_all_data()
    seed_database(insights_map)
    print("\nDone!")
