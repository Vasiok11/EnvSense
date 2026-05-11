#pragma once
#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

typedef struct {
    // mmWave LD2410
    uint8_t  radar_state;           // 0=none 1=moving 2=stationary 3=both
    uint16_t moving_distance_cm;
    uint8_t  moving_energy;
    uint16_t still_distance_cm;
    uint8_t  still_energy;
    uint16_t detect_distance_cm;

    // HW-072 Flame sensor
    int      flame_digital;         // LOW = flame detected

    // Flying Fish (light/IR)
    int      fish_analog;           // raw ADC (0-4095)
    float    fish_voltage;          // voltage after divider
    int      fish_digital;          // DO threshold output

    // FC-22 / MQ-7 Gas sensor
    int      mq7_analog;
    float    mq7_voltage;
    int      mq7_digital;

    // System
    bool     wifi_connected;
    uint32_t uptime_s;
} SensorPayload_t;

extern SensorPayload_t    g_payload;
extern SemaphoreHandle_t  g_payload_mutex;
