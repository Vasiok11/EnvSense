#pragma once
#include <Arduino.h>
#include <HardwareSerial.h>

// HLK-LD2410 UART driver
// 3V3 → ESP32 3V3  |  GND → ESP32 GND  (F-F direct)
// OT1 → P16 (UART1 RX)
// OT2 → P17 (UART1 TX, used for config only)
// RX  → unconnected
//
// Basic-mode data frame (23 bytes):
//  [0-3]  Header   F4 F3 F2 F1
//  [4-5]  Data len (0x0D 0x00)
//  [6]    Type     0x02
//  [7]    Inner header 0xAA
//  [8]    Target state  0=none 1=moving 2=still 3=both
//  [9-10] Moving distance cm (LSB first)
//  [11]   Moving energy
//  [12-13]Still distance cm (LSB first)
//  [14]   Still energy
//  [15-16]Detection distance cm
//  [17]   Inner tail 0x55
//  [18]   0x00
//  [19-22]Footer F8 F7 F6 F5

typedef struct {
    uint8_t  target_state;
    uint16_t moving_dist_cm;
    uint8_t  moving_energy;
    uint16_t still_dist_cm;
    uint8_t  still_energy;
    uint16_t detect_dist_cm;
    bool     valid;
} LD2410Frame_t;

void        mmwave_init(HardwareSerial &serial, int rx_pin, int tx_pin, uint32_t baud);
bool        mmwave_read_frame(LD2410Frame_t &out);
bool        mmwave_is_moving(const LD2410Frame_t &f);
bool        mmwave_is_present(const LD2410Frame_t &f);
const char* mmwave_state_str(const LD2410Frame_t &f);
