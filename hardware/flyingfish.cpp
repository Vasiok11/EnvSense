#include "flyingfish.h"
static uint8_t _ao, _do;

void flyingfish_init(uint8_t ao_pin, uint8_t do_pin) {
    _ao = ao_pin;
    _do = do_pin;
    pinMode(_do, INPUT);
    analogSetPinAttenuation(_ao, ADC_11db);   // full 0-3.3 V range
}
int   flyingfish_read_analog()  { return analogRead(_ao); }
float flyingfish_get_voltage()  { return (analogRead(_ao) / 4095.0f) * 3.3f; }
int   flyingfish_read_digital() { return digitalRead(_do); }
