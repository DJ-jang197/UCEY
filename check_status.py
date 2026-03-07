import asyncio
import backboard  # type: ignore
import os

async def main():
    client = backboard.BackboardClient(api_key='espr_FrJgd6LHFYLXwmAHv5_y4_0NLiGzc-lc4jluwyMyt_4')
    
    threads = await client.list_threads()
    if not threads:
        print("No threads found")
        return
    thread_id = threads[0].thread_id
    print(f"Checking thread {thread_id}")
    
    docs = await client.list_thread_documents(thread_id=thread_id)
    for doc in docs:
        print(f"Doc ID: {doc.document_id}, Status Name: {getattr(doc.status, 'name', 'N/A')}, Status Value: {getattr(doc.status, 'value', str(doc.status))}")

if __name__ == "__main__":
    asyncio.run(main())
