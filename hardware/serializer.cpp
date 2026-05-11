#include "serializer.h"
#include <Arduino.h>

String serializer_to_json(const SensorPayload_t &p) {
    char buf[256];
    
    // Map hardware sensors to backend expectations
    int co2_mapped = 400 + (int)(p.mq7_voltage * 500); // Map 0-3.3V to 400-2050 ppm
    float temp_mapped = 20.0 + (p.fish_voltage * 5.0); // Map to 20-36.5 C
    float humidity_mapped = 45.0 + (p.flame_digital == LOW ? 20.0 : 0.0); // Spike humidity if flame
    bool occupancy = (p.radar_state > 0);
    
    snprintf(buf, sizeof(buf),
        "{\"co2\":%d,\"temp\":%.1f,\"humidity\":%.1f,\"occupancy\":%s,\"radar_energy\":%u}",
        co2_mapped,
        temp_mapped,
        humidity_mapped,
        occupancy ? "true" : "false",
        p.moving_energy);
        
    return String(buf);
}

size_t serializer_to_binary(const SensorPayload_t &p, uint8_t* buf, size_t len) {
    if (len < 20) return 0;
    buf[0]  = 0xAB;
    buf[1]  = p.radar_state;
    buf[2]  =  p.moving_distance_cm       & 0xFF;
    buf[3]  = (p.moving_distance_cm >> 8) & 0xFF;
    buf[4]  = p.moving_energy;
    buf[5]  =  p.still_distance_cm        & 0xFF;
    buf[6]  = (p.still_distance_cm >> 8)  & 0xFF;
    buf[7]  = p.still_energy;
    buf[8]  = (uint8_t)p.flame_digital;
    buf[9]  =  p.fish_analog        & 0xFF;
    buf[10] = (p.fish_analog >> 8)  & 0xFF;
    buf[11] = (uint8_t)p.fish_digital;
    buf[12] =  p.mq7_analog         & 0xFF;
    buf[13] = (p.mq7_analog >> 8)   & 0xFF;
    buf[14] = (uint8_t)p.mq7_digital;
    buf[15] = p.wifi_connected ? 1 : 0;
    uint32_t up = p.uptime_s;
    buf[16] =  up        & 0xFF;
    buf[17] = (up >> 8)  & 0xFF;
    buf[18] = (up >> 16) & 0xFF;
    buf[19] = (up >> 24) & 0xFF;
    return 20;
}
