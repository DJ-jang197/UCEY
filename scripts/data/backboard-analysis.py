#!/usr/bin/env python3
"""
Optional Backboard analysis helper for contamination CSV.

Required env:
  BACKBOARD_API_KEY

Usage:
  BACKBOARD_API_KEY=... python3 scripts/data/backboard-analysis.py
"""

import asyncio
import os
import sys

try:
    import backboard  # type: ignore
except ImportError:
    print("Missing dependency: backboard. Install it in your Python environment first.")
    sys.exit(1)


INPUT_FILE = "data/raw/fcsi/fcsi_contamination_filtered.csv"
OUTPUT_FILE = "data/raw/fcsi/backboard_analysis_result.txt"


async def main():
    api_key = os.getenv("BACKBOARD_API_KEY", "").strip()
    if not api_key:
        print("BACKBOARD_API_KEY is missing.")
        sys.exit(1)

    if not os.path.exists(INPUT_FILE):
        print(f"Input file not found: {INPUT_FILE}")
        sys.exit(1)

    client = backboard.BackboardClient(api_key=api_key)

    assistant = await client.create_assistant(
        name="Soil Contamination Analyst",
        description=(
            "Analyzes contamination data by city, medium, and contaminant type "
            "for urban redevelopment decisions."
        ),
        system_prompt=(
            "You are an expert environmental data analyst. Provide concise, factual, "
            "actionable summaries for planners."
        ),
    )

    thread = await client.create_thread(assistant_id=assistant.assistant_id)
    doc = await client.upload_document_to_thread(thread_id=thread.thread_id, file_path=INPUT_FILE)

    while True:
        status_info = await client.get_document_status(doc.document_id)
        current_status = getattr(status_info.status, "value", str(status_info.status)).lower()
        if "completed" in current_status or "processed" in current_status or "indexed" in current_status:
            break
        if "failed" in current_status:
            print("Document indexing failed.")
            sys.exit(1)
        await asyncio.sleep(2)

    prompt = (
        "Summarize contamination risk patterns for Toronto, Vancouver, and Montreal. "
        "Include contaminant groups, medium distribution, and redevelopment implications."
    )
    response = await client.add_message(thread_id=thread.thread_id, content=prompt, stream=False)
    content = getattr(response, "content", str(response))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        file.write(content)

    print(f"Analysis written to {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
