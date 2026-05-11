#include "sensor_data.h"
SensorPayload_t   g_payload       = {};
SemaphoreHandle_t g_payload_mutex = nullptr;
