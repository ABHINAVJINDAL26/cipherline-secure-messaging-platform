import asyncio
import json
import websockets
async def main():
    uri = "ws://127.0.0.1:8000/ws/1362a93e-54b3-4d9e-a912-f0e467643e84?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMzYyYTkzZS01NGIzLTRkOWUtYTkxMi1mMGU0Njc2NDNlODQiLCJleHAiOjE3ODcyMzEwMzZ9.QKA2Jt45MY_OGy5USPk05tz9A-3pTmqwNnABGizw5To"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"type":"ping"}))
        try:
            msg = await ws.recv()
            print('RECV:', msg)
        except Exception as e:
            print('ERR', e)
asyncio.run(main())
