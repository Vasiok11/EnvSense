#pragma once
#include "sensor_data.h"

// Compact JSON string
String serializer_to_json(const SensorPayload_t &p);

// 20-byte binary frame
// [0]    0xAB magic
// [1]    radar state
// [2-3]  moving_dist_cm  (LE)
// [4]    moving_energy
// [5-6]  still_dist_cm   (LE)
// [7]    still_energy
// [8]    flame_digital
// [9-10] fish_analog      (LE)
// [11]   fish_digital
// [12-13]mq7_analog       (LE)
// [14]   mq7_digital
// [15]   wifi_connected
// [16-19]uptime_s         (LE)
size_t serializer_to_binary(const SensorPayload_t &p, uint8_t* buf, size_t buf_len);
