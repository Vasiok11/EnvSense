/*
 * ════════════════════════════════════════════════════════════
 *  ESP32 Modular RTOS Firmware
 * ════════════════════════════════════════════════════════════
 *
 *  Wiring summary
 *  ──────────────
 *  Power rails (breadboard)
 *    ESP32 3V3 → left  red  rail
 *    ESP32 5V  → right red  rail
 *    ESP32 GND → left  blue rail
 *    ESP32 GND → right blue rail
 *
 *  HW-072 Flame sensor   (F-F direct)
 *    VCC → 3V3  |  GND → GND  |  DO → P32
 *
 *  HLK-LD2410 mmWave     (F-F direct)
 *    3V3 → 3V3  |  GND → GND  |  OT1 → P16  |  OT2 → P17  |  RX unconnected
 *
 *  Flying Fish IR/light  (M-F to breadboard)
 *    VCC → right 5V rail  |  GND → left GND rail
 *    AO  → row 20 → divider#1 (3.3k+6.8k+20k → GND) → P34
 *    DO  → row 40 → 1kΩ → P33
 *
 *  FC-22 / MQ-7 Gas      (M-F to breadboard)
 *    VCC → right 5V rail  |  GND → left GND rail
 *    AO  → row 30 → divider#2 (3.3k+6.8k+20k → GND) → P35
 *    DO  → row 45 → 1kΩ → P25
 *
 *  Tasks
 *  ──────
 *  Core 0: wifi_task  |  serial_print_task
 *  Core 1: radar_task |  sensors_task
 *
 *  Safety: hardware watchdog (esp_task_wdt) – every task registers
 *          itself and resets periodically; trigger_panic = true.
 * ════════════════════════════════════════════════════════════
 */

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/semphr.h>

#include "config.h"
#include "sensor_data.h"
#include "wifi_manager.h"
#include "watchdog.h"
#include "tasks.h"

void setup() {
    Serial.begin(115200);
    delay(300);
    Serial.println("\n=== ESP32 Modular RTOS Firmware ===");

    // Shared payload mutex
    g_payload_mutex = xSemaphoreCreateMutex();
    configASSERT(g_payload_mutex);

    // Hardware watchdog
    watchdog_init();

    // ── Launch tasks ───────────────────────────────────────────────────────
    // Using xTaskCreate for compatibility with single-core RISC-V architectures (e.g. ESP32-C3)
    xTaskCreate(wifi_task,         "WiFi",    STACK_WIFI,    NULL, TASK_PRIO_WIFI,    NULL);
    xTaskCreate(serial_print_task, "Serial",  STACK_SERIAL,  NULL, TASK_PRIO_SERIAL,  NULL);
    xTaskCreate(radar_task,        "Radar",   STACK_RADAR,   NULL, TASK_PRIO_RADAR,   NULL);
    xTaskCreate(sensors_task,      "Sensors", STACK_SENSORS, NULL, TASK_PRIO_SENSORS, NULL);

    Serial.println("[Main] All tasks launched.");
}

void loop() {
    // Main loop only feeds the watchdog; work is in tasks
    watchdog_reset();
    vTaskDelay(pdMS_TO_TICKS(5000));
}
