# EnvSense Database Architecture & Future Roadmap

This document outlines the polyglot database strategy for the EnvSense IoT platform. It explains the exact flow of data across different systems and documents the required structural improvements before the project moves to production.

## 🏛️ Polyglot Persistence Strategy

We use a **two-database architecture** (Polyglot Persistence) because the system handles two fundamentally different types of data:
*   **PostgreSQL (via Prisma):** Handles highly relational, stateful, and mutable data. (Users, Organizations, Device states, Alerts, Roles, Authentication).
*   **InfluxDB:** Handles high-velocity, immutable, time-series data. (Air quality metrics, temperature, motion sensor payloads).

---

## 🔄 The Three Core Database Flows

### 1. Device Provisioning & Auth Flow (PostgreSQL)
**Purpose:** Handles onboarding hardware safely and associating it with user organizations.
*   **Action:** An admin registers a new device via the frontend.
*   **DB Write:** Prisma inserts a new `Device` record into PostgreSQL, creating a secure `pairingToken` (AES-GCM encrypted).
*   **Hardware Boot:** When the ESP32 turns on, it sends a pairing request over MQTT/HTTP.
*   **DB Read:** The Node backend queries PostgreSQL to validate the hardware MAC/ID and the token.
*   **Outcome:** If validated, the device's status is toggled to `ONLINE` and it is permitted to publish telemetry.

### 2. Telemetry Ingestion Flow (Hybrid/InfluxDB + PostgreSQL)
**Purpose:** Processing real-time sensor loops. Must be blazing fast and non-blocking.
*   **Action:** Device publishes via MQTT (`{ co2: 600, temp: 22.0 }`).
*   **Time-Series Write:** Node.js instantly writes the raw payload into **InfluxDB** using append-only bulk writes.
*   **Rules Engine Evaluation:** Node.js simultaneously checks the payload against the custom thresholds stored in **PostgreSQL** (`DeviceRuleThreshold`).
*   **Relational Write (Alerts):** If a threshold is broken (e.g., CO2 > 1200), the system uses Prisma to write a permanent `Alert` record to **PostgreSQL**.
*   **WebSocket Emit:** Data is broadcasted to the live live-view UI.

### 3. Consumer / Dashboard Read Flow (Hybrid/Aggregated)
**Purpose:** Fetching historic data and state for the frontend NOC (Network Operations Center).
*   **Action:** A user logs in and loads the dashboard.
*   **Relational Read (PostgreSQL):** Prisma fetches the `User` organization, the list of associated `Devices`, their current status, and any active `Alert` records.
*   **Analytical Read (InfluxDB):** The backend queries InfluxDB for time-series aggregations (e.g., "Give me the 1-hour moving average of CO2 and Thermal Comfort for the last 7 days").
*   **Outcome:** The frontend merges these two data streams, overlaying relational Alerts as markers on top of the InfluxDB historical charts.

---

## 🚀 Future Improvements (Pre-Production Checklist)

Before releasing to production, these structural Prisma/PostgreSQL upgrades must be implemented:

### 1. Referential Integrity (Cascading Deletes)
Currently, deleting an `Organization` will cause foreign key errors because it has associated devices. We must add `onDelete: Cascade` to schema relations.
```prisma
model Device {
  // ...
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

### 2. Database Indexing Strategy
The `Alert` and `Device` tables will grow massively. Without explicit indexes, dashboard queries will slow down over time.
```prisma
model Alert {
  // ...
  deviceId    String
  createdAt   DateTime @default(now())

  @@index([deviceId, createdAt]) // Compound index for fast timeline queries
}
```

### 3. Expanded IoT Metadata Column
The current Device table is rigid. We need tracking for offline periods, firmware tracking, and a flexible JSON column for hardware-specific quirks.
```prisma
model Device {
  // ...
  firmwareVersion String   @default("1.0.0")
  lastHeartbeat   DateTime @default(now())
  metadata        Json?    // e.g., { "wifiStrength": -65, "battery": 92 }
}
```

### 4. Security Audit Logging
If an employee changes the HVAC CO2 threshold, causing a system disruption, there must be a paper trail.
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  action    String   // e.g., "UPDATED_THRESHOLD"
  userId    String
  deviceId  String?
  timestamp DateTime @default(now())
}
```

### 5. Transition to Prisma Migrations
We are currently using `npx prisma db push` for prototyping. For the actual deployment, we must switch to SQL migrations using `npx prisma migrate dev`. This will generate SQL files that safely version the database across different environments (Staging -> Production) without data loss.

---

## 📝 General Note on Polyglot Architecture
When designing the frontend API endpoints later, remember that **Prisma never queries InfluxDB**. The `IngestionService` and `TelemetryService` orchestrate the boundaries. Keep cross-database transactions asynchronous. If InfluxDB writes fail, do not crash the PostgreSQL transaction, and vice versa.