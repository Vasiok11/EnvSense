#include "watchdog.h"
#include "config.h"
#include <esp_task_wdt.h>
#include <Arduino.h>

void watchdog_init() {
    esp_task_wdt_config_t cfg = {
        .timeout_ms     = WDT_TIMEOUT_S * 1000,
        .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
        .trigger_panic  = true
    };
    esp_task_wdt_deinit();
    esp_task_wdt_init(&cfg);
    esp_task_wdt_add(NULL);
    Serial.printf("[WDT] Watchdog armed: %d s\n", WDT_TIMEOUT_S);
}

void watchdog_reset() { esp_task_wdt_reset(); }
