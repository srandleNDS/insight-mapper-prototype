import os
import sys
import csv
import openpyxl
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from models import db, Insight, DataPoint, SourceMapping
from app import app

EXCEL_FILE = 'attached_assets/data_dictionary_ascendgp_1769795277239.xlsx'
SOURCE_DATA_FILE = 'attached_assets/ascendgp_full_data_list_1769795277238.csv'

def load_source_lookup():
    """Load the source data list into a lookup dictionary for matching"""
    lookup = {}
    
    if not os.path.exists(SOURCE_DATA_FILE):
        print(f"Source data file not found: {SOURCE_DATA_FILE}")
        return lookup
    
    encodings = ['utf-8', 'latin-1', 'cp1252']
    for enc in encodings:
        try:
            with open(SOURCE_DATA_FILE, 'r', encoding=enc) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    schema = row.get('Schema', '').strip()
                    table = row.get('TableName', '').strip()
                    column = row.get('ColumnName', '').strip()
                    data_type = row.get('DataType', '').strip()
                    
                    if table and column:
                        key = column.lower()
                        if key not in lookup:
                            lookup[key] = []
                        lookup[key].append({
                            'schema': schema,
                            'table': table,
                            'column': column,
                            'data_type': data_type
                        })
            print(f"Loaded {len(lookup)} unique column names from source data")
            return lookup
        except Exception as e:
            continue
    
    return lookup

def find_source_match(field_name, source_lookup):
    """Try to find a matching source column for a field name"""
    if not field_name:
        return None
    
    field_lower = field_name.lower().replace(' ', '').replace('_', '')
    
    for key, matches in source_lookup.items():
        key_clean = key.lower().replace(' ', '').replace('_', '')
        if field_lower == key_clean or field_lower in key_clean or key_clean in field_lower:
            return matches[0]
    
    return None

def load_ascendgp_data():
    """Load AscendGP data from Excel file"""
    if not os.path.exists(EXCEL_FILE):
        print(f"Excel file not found: {EXCEL_FILE}")
        return
    
    source_lookup = load_source_lookup()
    
    wb = openpyxl.load_workbook(EXCEL_FILE)
    sheet = wb.active
    
    headers = [cell.value for cell in sheet[1]]
    print(f"Headers: {headers}")
    
    insights_map = {}
    row_count = 0
    
    for row in sheet.iter_rows(min_row=2, values_only=True):
        row_count += 1
        
        product = str(row[0] or '').strip()
        tab_name = str(row[1] or '').strip()
        viz_name = str(row[2] or '').strip()
        viz_calc = str(row[3] or '').strip()
        data_point = str(row[4] or '').strip()
        dp_calc = str(row[5] or '').strip()
        dd_table = str(row[6] or '').strip()
        dd_field = str(row[7] or '').strip()
        dd_type = str(row[8] or '').strip()
        src_type = str(row[9] or '').strip()
        src_collection = str(row[10] or '').strip()
        src_table = str(row[11] or '').strip()
        src_column = str(row[12] or '').strip()
        src_data_type = str(row[13] or '').strip()
        
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
        elif viz_calc and not insights_map[insight_key]['calculation']:
            insights_map[insight_key]['calculation'] = viz_calc
        
        dp_name = data_point if data_point else dd_field
        if not dp_name:
            continue
        
        dp_key = dp_name
        if dp_key not in insights_map[insight_key]['data_points']:
            insights_map[insight_key]['data_points'][dp_key] = {
                'name': dp_name,
                'ent_table': '',
                'ent_field': data_point,
                'ent_type': '',
                'calculation': dp_calc,
                'source_mappings': []
            }
        
        if not src_table and not src_column:
            match = find_source_match(dp_name, source_lookup)
            if match:
                src_table = match['table']
                src_column = match['column']
                src_data_type = match['data_type']
        
        if src_table or src_column or dd_table or dd_field:
            mapping = {
                'source_system': src_collection if src_collection else 'AscendGP',
                'source_name': src_collection if src_collection else 'AscendGP',
                'table': src_table,
                'field': src_column,
                'data_type': src_data_type,
                'source_type': src_type if src_type else 'Microsoft SQL Server',
                'dd_table': dd_table,
                'dd_field': dd_field,
                'dd_type': dd_type
            }
            
            existing = insights_map[insight_key]['data_points'][dp_key]['source_mappings']
            if mapping not in existing:
                existing.append(mapping)
    
    print(f"Processed {row_count} rows")
    print(f"Found {len(insights_map)} unique visualizations")
    
    with app.app_context():
        insight_count = 0
        dp_count = 0
        mapping_count = 0
        
        for key, data in insights_map.items():
            insight = Insight(
                insight_name=data['insight_name'],
                tab_name=data['tab_name'],
                calculation=data['calculation'],
                products_used_in=','.join(data['products_used_in']),
                product=data['product']
            )
            db.session.add(insight)
            db.session.flush()
            insight_count += 1
            
            for dp_key, dp_data in data['data_points'].items():
                data_point = DataPoint(
                    insight_id=insight.id,
                    name=dp_data['name'],
                    ent_table=dp_data['ent_table'],
                    ent_field=dp_data['ent_field'],
                    ent_type=dp_data['ent_type'],
                    calculation=dp_data['calculation']
                )
                db.session.add(data_point)
                db.session.flush()
                dp_count += 1
                
                for mapping in dp_data['source_mappings']:
                    source_mapping = SourceMapping(
                        data_point_id=data_point.id,
                        source_system=mapping['source_system'],
                        source_name=mapping['source_name'],
                        table=mapping['table'],
                        field=mapping['field'],
                        data_type=mapping['data_type'],
                        source_type=mapping['source_type'],
                        dd_table=mapping['dd_table'],
                        dd_field=mapping['dd_field'],
                        dd_type=mapping['dd_type']
                    )
                    db.session.add(source_mapping)
                    mapping_count += 1
        
        db.session.commit()
        
        print(f"\nAscendGP Data Loaded:")
        print(f"  Insights: {insight_count}")
        print(f"  Data Points: {dp_count}")
        print(f"  Source Mappings: {mapping_count}")

if __name__ == '__main__':
    load_ascendgp_data()
