#include "tasks.h"
#include "config.h"
#include "sensor_data.h"
#include "mmwave_driver.h"
#include "hw072.h"
#include "flyingfish.h"
#include "mq7.h"
#include "serializer.h"
#include "watchdog.h"
#include "mqtt_client.h"
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <esp_task_wdt.h>

static HardwareSerial LD2410_Serial(LD2410_UART_NUM);

// ── Radar Task (Core 1, priority 4) ──────────────────────────────────────────
void radar_task(void* pv) {
    esp_task_wdt_add(NULL);
    mmwave_init(LD2410_Serial, LD2410_RX, LD2410_TX, LD2410_BAUD);
    Serial.println("[Radar] LD2410 UART ready on P16(RX)/P17(TX)");

    LD2410Frame_t frame;
    for (;;) {
        if (mmwave_read_frame(frame)) {
            if (xSemaphoreTake(g_payload_mutex, pdMS_TO_TICKS(50)) == pdTRUE) {
                g_payload.radar_state        = frame.target_state;
                g_payload.moving_distance_cm = frame.moving_dist_cm;
                g_payload.moving_energy      = frame.moving_energy;
                g_payload.still_distance_cm  = frame.still_dist_cm;
                g_payload.still_energy       = frame.still_energy;
                g_payload.detect_distance_cm = frame.detect_dist_cm;
                xSemaphoreGive(g_payload_mutex);
            }
        }
        esp_task_wdt_reset();
        vTaskDelay(pdMS_TO_TICKS(20));   // ~50 Hz polling
    }
}

// ── Environmental Sensors Task (Core 1, priority 2) ──────────────────────────
void sensors_task(void* pv) {
    esp_task_wdt_add(NULL);
    hw072_init(FLAME_DO_PIN);
    flyingfish_init(FISH_AO_PIN, FISH_DO_PIN);
    mq7_init(MQ7_AO_PIN, MQ7_DO_PIN);
    Serial.println("[Sensors] HW-072 P32 | FlyingFish AO:P34 DO:P33 | MQ-7 AO:P35 DO:P25");

    for (;;) {
        int   flame  = hw072_read();
        int   fish_a = flyingfish_read_analog();
        float fish_v = flyingfish_get_voltage();
        int   fish_d = flyingfish_read_digital();
        int   mq7_a  = mq7_read_analog();
        float mq7_v  = mq7_get_voltage();
        int   mq7_d  = mq7_read_digital();

        if (xSemaphoreTake(g_payload_mutex, pdMS_TO_TICKS(50)) == pdTRUE) {
            g_payload.flame_digital = flame;
            g_payload.fish_analog   = fish_a;
            g_payload.fish_voltage  = fish_v;
            g_payload.fish_digital  = fish_d;
            g_payload.mq7_analog    = mq7_a;
            g_payload.mq7_voltage   = mq7_v;
            g_payload.mq7_digital   = mq7_d;
            g_payload.uptime_s      = millis() / 1000;
            xSemaphoreGive(g_payload_mutex);
        }
        esp_task_wdt_reset();
        vTaskDelay(pdMS_TO_TICKS(SENSOR_POLL_MS));
    }
}

// ── Serial / Serialization / MQTT Task (Core 0, priority 1) ────────────────
void mqtt_publish_task(void* pv) {
    esp_task_wdt_add(NULL);
    SensorPayload_t snap;

    for (;;) {
        if (xSemaphoreTake(g_payload_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
            memcpy(&snap, &g_payload, sizeof(SensorPayload_t));
            xSemaphoreGive(g_payload_mutex);
        }

        // JSON output
        String json = serializer_to_json(snap);
        Serial.println(json);
        
        // Publish to MQTT
        mqtt_publish(json.c_str());

        // Binary output (hex dump)
        uint8_t bin[20];
        size_t  n = serializer_to_binary(snap, bin, sizeof(bin));
        Serial.printf("[BIN %zu B] ", n);
        for (size_t i = 0; i < n; i++) Serial.printf("%02X ", bin[i]);
        Serial.println();

        esp_task_wdt_reset();
        vTaskDelay(pdMS_TO_TICKS(SERIAL_PRINT_MS));
    }
}

// ── Relay Task (Core 1) ──────────────────────────────────────────────────────
static QueueHandle_t relay_queue = NULL;

void relay_command_callback(bool ventilation_on) {
    if (relay_queue != NULL) {
        xQueueSend(relay_queue, &ventilation_on, 0);
    }
}

void relay_task(void* pv) {
    esp_task_wdt_add(NULL);
    pinMode(RELAY_GPIO_PIN, OUTPUT);
    digitalWrite(RELAY_GPIO_PIN, LOW);
    
    relay_queue = xQueueCreate(5, sizeof(bool));
    mqtt_set_command_callback(relay_command_callback);
    
    bool state = false;
    for (;;) {
        if (xQueueReceive(relay_queue, &state, pdMS_TO_TICKS(100)) == pdTRUE) {
            digitalWrite(RELAY_GPIO_PIN, state ? HIGH : LOW);
            Serial.printf("[Relay] Ventilation turned %s\n", state ? "ON" : "OFF");
        }
        
        esp_task_wdt_reset();
        vTaskDelay(pdMS_TO_TICKS(100)); // Non-blocking wait
    }
}
