#pragma once

// ── Wi-Fi (SmartConfig Provisioning) ─────────────────────────────────────────
#define WIFI_RETRY_MS    5000
#define WIFI_MAX_RETRY   10
// ── MQTT ──────────────────────────────────────────────────────────────────
#define MQTT_BROKER_HOST "broker.hivemq.com"
#define MQTT_BROKER_PORT 1883
#define MQTT_TOPIC_TELEMETRY "envsense_pbl/telemetry/"
#define MQTT_TOPIC_COMMAND   "envsense_pbl/command/"

// ── Relay Control ─────────────────────────────────────────────────────────
#define RELAY_GPIO_PIN   26
// ── LD2410 mmWave UART ────────────────────────────────────────────────────────
#define LD2410_UART_NUM  1          // HardwareSerial(1)
#define LD2410_BAUD      256000
#define LD2410_RX        16         // OT1 → ESP32 P16
#define LD2410_TX        17         // OT2 → ESP32 P17

// ── HW-072 Flame Sensor ───────────────────────────────────────────────────────
#define FLAME_DO_PIN     32         // DO → ESP32 P32 (F-F direct)

// ── Flying Fish (Light/IR) sensor ─────────────────────────────────────────────
// VCC → right 5V rail  |  GND → left GND rail
// AO  → row 20 → divider #1 (3.3k+6.8k+20k) → ESP32 P34
// DO  → row 40 → 1kΩ → ESP32 P33
#define FISH_AO_PIN      34
#define FISH_DO_PIN      33

// ── FC-22 / MQ-7 Gas Sensor ───────────────────────────────────────────────────
// VCC → right 5V rail  |  GND → left GND rail
// AO  → row 30 → divider #2 (3.3k+6.8k+20k) → ESP32 P35
// DO  → row 45 → 1kΩ → ESP32 P25
#define MQ7_AO_PIN       35
#define MQ7_DO_PIN       25

// ── Watchdog ─────────────────────────────────────────────────────────────────
#define WDT_TIMEOUT_S    30

// ── FreeRTOS task priorities & stack sizes ───────────────────────────────────
#define TASK_PRIO_WIFI      3
#define TASK_PRIO_RADAR     4
#define TASK_PRIO_SENSORS   2
#define TASK_PRIO_SERIAL    1

#define STACK_WIFI      4096
#define STACK_RADAR     4096
#define STACK_SENSORS   3072
#define STACK_SERIAL    3072

// ── Timing ────────────────────────────────────────────────────────────────────
#define SENSOR_POLL_MS   500
#define SERIAL_PRINT_MS  1000
