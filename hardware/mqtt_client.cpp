#include <WiFi.h>
#include <PubSubClient.h>
#include "mqtt_client.h"
#include "config.h"

// Client instance
static WiFiClient espClient;
static PubSubClient client(espClient);

// Device ID
static String deviceId;
static String telemetryTopic;
static String commandTopic;

// Reconnect logic variables
static unsigned long lastReconnectAttempt = 0;
static unsigned long currentBackoff = 500;
static const unsigned long MAX_BACKOFF = 30000;

// Relay callback definition (to be set by hardware/tasks.cpp)
typedef void (*CommandCallback)(bool ventilation_on);
static CommandCallback onCommandReceived = nullptr;

// Set the command callback from tasks.cpp
void mqtt_set_command_callback(CommandCallback cb) {
    onCommandReceived = cb;
}

// MQTT Message received callback
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    if (String(topic) == commandTopic) {
        String msg = "";
        for (unsigned int i = 0; i < length; i++) {
            msg += (char)payload[i];
        }
        
        // Very simple JSON parsing for {"command":"activate_ventilation"}
        // In reality, use ArduinoJson, but doing basic text matching here
        if (msg.indexOf("\"command\":\"activate_ventilation\"") != -1) {
            if (onCommandReceived) onCommandReceived(true);
        } else if (msg.indexOf("\"command\":\"deactivate_ventilation\"") != -1) {
            if (onCommandReceived) onCommandReceived(false);
        }
    }
}

// Non-blocking reconnect
static void mqtt_reconnect() {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > currentBackoff) {
        lastReconnectAttempt = now;
        
        if (client.connect(deviceId.c_str())) {
            // Connected successfully
            currentBackoff = 500; // Reset backoff
            client.subscribe(commandTopic.c_str());
            Serial.println("[MQTT] Connected & Subscribed to " + commandTopic);
        } else {
            // Failed, exponential backoff
            currentBackoff *= 2;
            if (currentBackoff > MAX_BACKOFF) {
                currentBackoff = MAX_BACKOFF;
            }
        }
    }
}

void mqtt_init() {
    // Generate unique device ID
    deviceId = "ESP32_" + String((uint32_t)(ESP.getEfuseMac() >> 32), HEX) + String((uint32_t)ESP.getEfuseMac(), HEX);
    
    telemetryTopic = String(MQTT_TOPIC_TELEMETRY) + deviceId;
    commandTopic = String(MQTT_TOPIC_COMMAND) + deviceId;

    client.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
    client.setCallback(mqtt_callback);
    
    Serial.println("[MQTT] Init with ID: " + deviceId);
}

void mqtt_loop() {
    if (!client.connected() && WiFi.status() == WL_CONNECTED) {
        mqtt_reconnect();
    }
    client.loop();
}

bool mqtt_is_connected() {
    return client.connected();
}

void mqtt_publish(const char* payload) {
    if (client.connected()) {
        client.publish(telemetryTopic.c_str(), payload);
    }
}