#pragma once
#include <Arduino.h>

void wifi_manager_init();
bool wifi_is_connected();
void wifi_task(void* pv);
