import os
import json
from openai import OpenAI

AI_INTEGRATIONS_OPENAI_API_KEY = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY")
AI_INTEGRATIONS_OPENAI_BASE_URL = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")

# the newest OpenAI model is "gpt-5" which was released August 7, 2025.
# do not change this unless explicitly requested by the user
MODEL = "gpt-5"

def get_client():
    return OpenAI(
        api_key=AI_INTEGRATIONS_OPENAI_API_KEY,
        base_url=AI_INTEGRATIONS_OPENAI_BASE_URL
    )


def explain_calculation(calculation, viz_name, data_points):
    client = get_client()
    dp_names = ", ".join([dp["name"] for dp in data_points]) if data_points else "N/A"

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a data analytics expert. Explain SQL calculations and data visualization logic in plain English. Be concise and clear. Target a business user audience."
            },
            {
                "role": "user",
                "content": f"Explain what this data visualization calculation does:\n\nVisualization: {viz_name}\nData Points: {dp_names}\nCalculation: {calculation}\n\nProvide:\n1. A one-sentence summary\n2. A step-by-step breakdown of the logic\n3. What business question this answers"
            }
        ],
        max_completion_tokens=1024
    )
    return response.choices[0].message.content


def suggest_mappings(unmapped_field, viz_name, tab_name, existing_mappings, source_tables):
    client = get_client()

    existing_examples = []
    for m in existing_mappings[:10]:
        existing_examples.append(f"  Field '{m['field_name']}' -> Table: {m['table']}, Column: {m['column']}, Type: {m['data_type']}")
    examples_str = "\n".join(existing_examples) if existing_examples else "  No existing mappings available"

    tables_str = "\n".join([f"  {t['table']}: {', '.join(t['columns'][:10])}" for t in source_tables[:20]]) if source_tables else "  No source tables available"

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a healthcare data mapping expert. Suggest source database mappings for unmapped data fields. Return JSON format."
            },
            {
                "role": "user",
                "content": f"""Suggest source database mappings for this unmapped field:

Field Name: {unmapped_field}
Visualization: {viz_name}
Tab/Category: {tab_name}

Existing mapped fields in this visualization:
{examples_str}

Available source tables and columns:
{tables_str}

Return a JSON object with:
{{
  "suggestions": [
    {{
      "table": "suggested_table_name",
      "column": "suggested_column_name",
      "data_type": "suggested_type",
      "confidence": "high/medium/low",
      "reasoning": "why this mapping makes sense"
    }}
  ],
  "analysis": "brief analysis of the field and its likely purpose"
}}"""
            }
        ],
        response_format={"type": "json_object"},
        max_completion_tokens=1024
    )
    return json.loads(response.choices[0].message.content)


def natural_language_search(query, available_tabs, available_products):
    client = get_client()

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a search assistant for a healthcare data visualization mapping tool. Convert natural language queries into structured search parameters. Return JSON format."
            },
            {
                "role": "user",
                "content": f"""Convert this natural language search into structured filters:

Query: "{query}"

Available Tab Names: {', '.join(available_tabs)}
Available Products: {', '.join(available_products)}

Return a JSON object with:
{{
  "search_term": "text to search visualization names for (empty string if not applicable)",
  "product_filter": ["list of matching products or empty"],
  "tab_filter": ["list of matching tabs or empty"],
  "incomplete_only": false,
  "explanation": "what the user is looking for in plain English"
}}"""
            }
        ],
        response_format={"type": "json_object"},
        max_completion_tokens=512
    )
    return json.loads(response.choices[0].message.content)


def analyze_lineage(viz_name, data_points_with_mappings):
    client = get_client()

    lineage_data = []
    for dp in data_points_with_mappings:
        sources = []
        for sm in dp.get("sourceMappings", []):
            sources.append(f"    Source: {sm.get('sourceSystem', 'N/A')} -> {sm.get('table', 'N/A')}.{sm.get('field', 'N/A')} ({sm.get('dataType', 'N/A')})")
        sources_str = "\n".join(sources) if sources else "    UNMAPPED"
        lineage_data.append(f"  Field: {dp['name']} (Enterprise: {dp.get('entTable', 'N/A')}.{dp.get('entField', 'N/A')})\n{sources_str}")

    lineage_str = "\n".join(lineage_data)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a data lineage and data governance expert for healthcare analytics systems. Analyze data flows and identify potential issues."
            },
            {
                "role": "user",
                "content": f"""Analyze the data lineage for this visualization:

Visualization: {viz_name}

Data Points and their Source Mappings:
{lineage_str}

Provide:
1. A summary of the data flow from source to visualization
2. Any potential data quality concerns (type mismatches, missing mappings, inconsistencies)
3. Recommendations for improving data governance
4. A risk assessment (low/medium/high) for data accuracy"""
            }
        ],
        max_completion_tokens=1500
    )
    return response.choices[0].message.content


def ai_chat(message, context):
    client = get_client()

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": f"""You are an AI assistant for a healthcare data visualization mapping tool called InsightMapper. You help users understand their data mappings, visualizations, and source systems.

Current database context:
- Total Visualizations: {context.get('totalVisualizations', 'N/A')}
- Total Fields: {context.get('totalFields', 'N/A')}
- Mapped Fields: {context.get('mappedFields', 'N/A')}
- Unmapped Fields: {context.get('unmappedFields', 'N/A')}
- Products: {', '.join(context.get('products', []))}
- Source Systems: {', '.join(context.get('sourceSystems', []))}

Be helpful, concise, and specific. When referring to data, use the actual numbers and names from the context."""
            },
            {
                "role": "user",
                "content": message
            }
        ],
        max_completion_tokens=1024
    )
    return response.choices[0].message.content
