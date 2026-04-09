from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, pool_id: str):
        await websocket.accept()
        if pool_id not in self.active_connections:
            self.active_connections[pool_id] = []
        self.active_connections[pool_id].append(websocket)

    def disconnect(self, websocket: WebSocket, pool_id: str):
        if pool_id in self.active_connections:
            self.active_connections[pool_id].remove(websocket)
            if not self.active_connections[pool_id]:
                del self.active_connections[pool_id]

    async def broadcast(self, pool_id: str, message: dict):
        if pool_id in self.active_connections:
            for connection in self.active_connections[pool_id]:
                await connection.send_json(message)

manager = ConnectionManager()