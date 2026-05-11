#pragma once
#include <Arduino.h>

// Flying Fish light/IR sensor
// VCC → right 5V rail  |  GND → left GND rail
// AO  → row 20 → voltage divider (3.3k + 6.8k + 20k to GND) → P34
// DO  → row 40 → 1kΩ → P33
//
// Voltage divider output at P34:
//   Vout = Vin * (6.8k + 20k) / (3.3k + 6.8k + 20k) = Vin * 0.890 → max ~2.94 V (safe for 3.3V ADC)
void  flyingfish_init(uint8_t ao_pin, uint8_t do_pin);
int   flyingfish_read_analog();
float flyingfish_get_voltage();
int   flyingfish_read_digital();
