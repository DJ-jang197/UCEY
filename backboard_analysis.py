import asyncio
import backboard  # type: ignore
import sys

API_KEY = "espr_FrJgd6LHFYLXwmAHv5_y4_0NLiGzc-lc4jluwyMyt_4"

async def main():
    client = backboard.BackboardClient(api_key=API_KEY)
    
    print("Creating Backboard Assistant...")
    assistant = await client.create_assistant(
        name="Soil Contamination Analyst",
        description="Analyzes dataset regarding soil contamination in different areas with break downs of the different mediums of contamination.",
        system_prompt="You are an expert data analyst. You help summarize soil contamination data based on provided documents."
    )
    print(f"Assistant created with ID: {assistant.assistant_id}")
    
    print("Creating Thread...")
    thread = await client.create_thread(assistant_id=assistant.assistant_id)
    print(f"Thread created with ID: {thread.thread_id}")
    
    # We first try to upload the massive XML, if it fails, fallback to the pre-processed CSV.
    file_to_upload = "fcsi-rscf.xml"
    print(f"Uploading {file_to_upload}...")
    try:
        doc = await client.upload_document_to_thread(thread_id=thread.thread_id, file_path=file_to_upload)
        print(f"Document uploaded with ID: {doc.document_id}")
    except Exception as e:
        print(f"Failed to upload XML (likely due to 281MB file size). Error: {e}")
        file_to_upload = "contamination_summary.csv"
        print(f"Retrying with parsed summary {file_to_upload}...")
        doc = await client.upload_document_to_thread(thread_id=thread.thread_id, file_path=file_to_upload)
        print(f"Document uploaded with ID: {doc.document_id}")
    
    # Let backend ingest document completely:
    print("Waiting for document to finish indexing...")
    while True:
        status_info = await client.get_document_status(doc.document_id)
        # Check if status_info has a 'status' attribute or property
        current_status = getattr(status_info.status, 'value', str(status_info.status)).lower()
        if 'completed' in current_status or 'processed' in current_status or 'indexed' in current_status:
            print("Document indexing complete.")
            break
        elif 'failed' in current_status:
            print("Document indexing failed.")
            return
        await asyncio.sleep(2)

    
    prompt = ("Attached is the soil contamination data. "
              "Please provide a high-level summary of the data regarding "
              "soil contamination in different areas with break downs of the different mediums of contamination.")
    
    print("Sending message to Backboard AI...")
    try:
        response = await client.add_message(
            thread_id=thread.thread_id,
            content=prompt,
            stream=False
        )
        
        # In case the SDK returns an object with a content or message field.
        print("\n--- Backboard Response ---\n")
        resp_content = getattr(response, "content", str(response))
        print(resp_content)
        print("\n--------------------------\n")
        
        with open("backboard_analysis_result.txt", "w", encoding="utf-8") as f:
            f.write(resp_content)
        print("Analysis successfully saved to backboard_analysis_result.txt")
        
    except Exception as e:
        print(f"Failed during analysis: {e}")

if __name__ == "__main__":
    asyncio.run(main())
