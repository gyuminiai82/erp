from fastapi import WebSocket
from typing import List, Dict, Optional
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.all_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, employee_id: Optional[int] = None):
        await websocket.accept()
        self.all_connections.append(websocket)
        if employee_id:
            if employee_id not in self.active_connections:
                self.active_connections[employee_id] = []
            self.active_connections[employee_id].append(websocket)
        await self.broadcast_sessions()

    def disconnect(self, websocket: WebSocket, employee_id: Optional[int] = None):
        if websocket in self.all_connections:
            self.all_connections.remove(websocket)
        if employee_id and employee_id in self.active_connections:
            if websocket in self.active_connections[employee_id]:
                self.active_connections[employee_id].remove(websocket)
            if not self.active_connections[employee_id]:
                del self.active_connections[employee_id]

    async def broadcast_sessions(self):
        count = len(self.all_connections)
        message = json.dumps({"type": "active_sessions", "count": count})
        for connection in self.all_connections.copy():
            try:
                await connection.send_text(message)
            except Exception:
                pass

    async def send_personal_message(self, message: str, employee_id: int):
        if employee_id in self.active_connections:
            for connection in self.active_connections[employee_id].copy():
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

manager = ConnectionManager()
