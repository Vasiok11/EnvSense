#include "wifi_manager.h"
#include "config.h"
#include "sensor_data.h"
#include <WiFi.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

static bool _connected = false;

void wifi_manager_init() {
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(false);
}

bool wifi_is_connected() { return _connected; }

void wifi_task(void* pv) {
    uint8_t retry = 0;
    
    // Start SmartConfig Provisioning Mode
    Serial.println("[WiFi] Starting SmartConfig provisioning...");
    WiFi.beginSmartConfig();
    
    TickType_t sc_start = xTaskGetTickCount();
    while (!WiFi.smartConfigDone() && (xTaskGetTickCount() - sc_start) < pdMS_TO_TICKS(60000)) {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
    }
    Serial.println("\n[WiFi] SmartConfig finished or timed out.");

    for (;;) {
        if (WiFi.status() != WL_CONNECTED) {
            _connected = false;
            Serial.printf("[WiFi] Connecting (attempt %d/%d)...\n", retry + 1, WIFI_MAX_RETRY);
            
            // Fallback to begin() if already provisioned
            if (retry > 0 || WiFi.SSID() == "") {
                WiFi.begin();
            }

            TickType_t start = xTaskGetTickCount();
            while (WiFi.status() != WL_CONNECTED &&
                   (xTaskGetTickCount() - start) < pdMS_TO_TICKS(10000)) {
                vTaskDelay(pdMS_TO_TICKS(500));
            }

            if (WiFi.status() == WL_CONNECTED) {
                _connected = true; retry = 0;
                Serial.printf("[WiFi] Connected. IP: %s\n",
                              WiFi.localIP().toString().c_str());
            } else {
                if (++retry >= WIFI_MAX_RETRY) {
                    Serial.println("[WiFi] Max retries - rebooting.");
                    esp_restart();
                }
                Serial.printf("[WiFi] Retry %d/%d\n", retry, WIFI_MAX_RETRY);
            }

            if (xSemaphoreTake(g_payload_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
                g_payload.wifi_connected = _connected;
                xSemaphoreGive(g_payload_mutex);
            }
        } else {
            _connected = true;
        }
        vTaskDelay(pdMS_TO_TICKS(WIFI_RETRY_MS));
    }
}
