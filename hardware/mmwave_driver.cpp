#include "mmwave_driver.h"
#include <string.h>

static HardwareSerial* _serial = nullptr;
static const uint8_t HEADER[4] = {0xF4, 0xF3, 0xF2, 0xF1};
static const uint8_t FOOTER[4] = {0xF8, 0xF7, 0xF6, 0xF5};
#define FRAME_LEN 23

void mmwave_init(HardwareSerial &serial, int rx_pin, int tx_pin, uint32_t baud) {
    _serial = &serial;
    _serial->begin(baud, SERIAL_8N1, rx_pin, tx_pin);
}

bool mmwave_read_frame(LD2410Frame_t &out) {
    if (!_serial) { out.valid = false; return false; }
    static uint8_t buf[FRAME_LEN];
    static uint8_t idx = 0;

    while (_serial->available()) {
        uint8_t b = _serial->read();
        buf[idx++] = b;

        // Header sync
        if (idx <= 4) {
            if (b != HEADER[idx - 1]) { idx = 0; }
            continue;
        }
        if (idx < FRAME_LEN) continue;

        // Validate footer at bytes 19-22
        if (buf[19] == FOOTER[0] && buf[20] == FOOTER[1] &&
            buf[21] == FOOTER[2] && buf[22] == FOOTER[3]) {
            out.target_state   = buf[8];
            out.moving_dist_cm = (uint16_t)buf[9]  | ((uint16_t)buf[10] << 8);
            out.moving_energy  = buf[11];
            out.still_dist_cm  = (uint16_t)buf[12] | ((uint16_t)buf[13] << 8);
            out.still_energy   = buf[14];
            out.detect_dist_cm = (uint16_t)buf[15] | ((uint16_t)buf[16] << 8);
            out.valid = true;
            idx = 0;
            return true;
        }
        // Re-sync: slide buffer
        memmove(buf, buf + 1, FRAME_LEN - 1);
        idx = FRAME_LEN - 1;
    }
    out.valid = false;
    return false;
}

bool mmwave_is_moving(const LD2410Frame_t &f)  { return f.valid && (f.target_state == 1 || f.target_state == 3); }
bool mmwave_is_present(const LD2410Frame_t &f) { return f.valid && (f.target_state >= 1); }

const char* mmwave_state_str(const LD2410Frame_t &f) {
    if (!f.valid) return "INVALID";
    switch (f.target_state) {
        case 0: return "NO_TARGET";
        case 1: return "MOVING";
        case 2: return "STATIONARY";
        case 3: return "MOVING+STATIONARY";
        default: return "UNKNOWN";
    }
}
