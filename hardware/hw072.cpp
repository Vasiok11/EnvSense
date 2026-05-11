#include "hw072.h"
static uint8_t _pin;
void hw072_init(uint8_t do_pin) { _pin = do_pin; pinMode(_pin, INPUT); }
int  hw072_read()               { return digitalRead(_pin); }
