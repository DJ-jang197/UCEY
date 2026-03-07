import asyncio
import backboard  # type: ignore
import time

async def main():
    client = backboard.BackboardClient(api_key='espr_FrJgd6LHFYLXwmAHv5_y4_0NLiGzc-lc4jluwyMyt_4')
    ass = await client.create_assistant(name=f'test_{time.time()}')
    thread = await client.create_thread(assistant_id=ass.assistant_id)
    print("Thread Dict:", thread.__dict__)
    
    doc = await client.upload_document_to_thread(thread_id=thread.thread_id, file_path='contamination_summary.csv')
    print("Doc Dict:", doc.__dict__)

if __name__ == "__main__":
    asyncio.run(main())
