#pragma once
#include <Arduino.h>

// FC-22 / MQ-7 Gas sensor
// VCC → right 5V rail  |  GND → left GND rail
// AO  → row 30 → voltage divider (3.3k + 6.8k + 20k to GND) → P35
// DO  → row 45 → 1kΩ → P25
void  mq7_init(uint8_t ao_pin, uint8_t do_pin);
int   mq7_read_analog();
float mq7_get_voltage();
int   mq7_read_digital();
