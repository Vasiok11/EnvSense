# EnvSense API Documentation

## Base Information
- **Base URL:** `http://localhost:3000` (or the configured `PORT` in your `.env`)
- **Data Format:** Content-Type should be `application/json` for all requests and responses.
- **Authentication Method:** JWT Token passed in the Authorization header.

---

## 1. Authentication

### `POST /api/auth/login`
Authenticates a user and returns a token.

**Request Body:**
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Success Response (200 OK):**
*(Returns user data and a JWT token required for protected routes)*
```json
{
  "token": "eyJhbGciOiJIUz...",
  "user": {
      "id": "...",
      "username": "..."
  }
}
```

**Error Responses:**
- `400 Bad Request`: `{"error": "Username and password are required"}`
- `401 Unauthorized`: `{"error": "Invalid credentials"}`
- `500 Internal Server Error`: `{"error": "Internal Server Error"}`

---

## 2. Telemetry (Historical)

### `GET /api/telemetry/:deviceId`
**(Protected Route)** Fetches historical telemetry data for a specific device. 

**Headers Required:**
- `Authorization: Bearer <your_jwt_token>`

**Path Parameters:**
- `deviceId`: The ID of the device (e.g. `esp32_c3_env_01`)

**Query Parameters (Optional):**
- `view`: The time window of history to retrieve. Available options: `1h`, `24h` (default), `7d`.

**Example Request:**
`GET http://localhost:3000/api/telemetry/esp32_c3_env_01?view=24h`

**Success Response (200 OK):**
```json
{
  "deviceId": "esp32_c3_env_01",
  "view": "24h",
  "count": 150,
  "data": [
      {
         "temperature": 23.5,
         "humidity": 45.2,
         "timestamp": "2026-05-11T12:00:00Z"
      }
  ]
}
```

---

## 3. Real-Time Telemetry & Systems Logs (Server-Sent Events)

### `GET /api/telemetry/stream`
An open HTTP stream used to push live telemetry data and system logs to the dashboard in real-time. Better alternative to polling. 

*Note: For the demo code provided, this is not protected by an auth guard to facilitate easy dashboard connection, but it should be protected in production.*

**Usage in Frontend (JavaScript):**
```javascript
const eventSource = new EventSource('http://localhost:3000/api/telemetry/stream');

eventSource.onmessage = (event) => {
    const response = JSON.parse(event.data);
    
    if (response.status === 'connected') {
        console.log('Stream Connected!');
    }
    
    if (response.type === 'telemetry') {
        console.log('New Telemetry Data:', response.data);
        // Update charts/dashboard
    }

    if (response.type === 'log') {
        console.log('System Log Received:', response.data);
    }
};
```

---

## 4. WebSockets Integration (socket.io)

While real-time data streaming to the frontend is handled primarily via SSE, the backend is also configured to accept WebSockets via Socket.io at the root level (`/`).

**Connection Example (Frontend):**
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to WebSocket server with ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket server.");
});
```

---

## 5. System Health

### `GET /health`
Standard endpoint used to check if the API is up and running.

**Success Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2026-05-11T10:30:15.000Z"
}
```