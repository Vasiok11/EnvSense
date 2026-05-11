#pragma once
#include <Arduino.h>

// HW-072 Flame / IR sensor
// VCC → ESP32 3V3  |  GND → ESP32 GND  |  DO → P32  (F-F direct)
void hw072_init(uint8_t do_pin);
int  hw072_read();   // LOW = flame detected (active-low)
