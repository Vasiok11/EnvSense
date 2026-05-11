#include "mq7.h"
static uint8_t _ao, _do;

void mq7_init(uint8_t ao_pin, uint8_t do_pin) {
    _ao = ao_pin;
    _do = do_pin;
    pinMode(_do, INPUT);
    analogSetPinAttenuation(_ao, ADC_11db);
}
int   mq7_read_analog()  { return analogRead(_ao); }
float mq7_get_voltage()  { return (analogRead(_ao) / 4095.0f) * 3.3f; }
int   mq7_read_digital() { return digitalRead(_do); }
