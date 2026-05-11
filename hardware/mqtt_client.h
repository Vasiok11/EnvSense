#pragma once

typedef void (*CommandCallback)(bool ventilation_on);

void mqtt_init();
void mqtt_loop();
bool mqtt_is_connected();
void mqtt_publish(const char* payload);
void mqtt_set_command_callback(CommandCallback cb);