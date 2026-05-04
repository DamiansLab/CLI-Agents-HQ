# 🎮 M5StickC Plus 2: Hardware Agent Controller

This file serves as the master reference for using the M5StickC Plus 2 as a standalone hardware agent for the CLI Agents HQ ecosystem.

## 🚀 Overview
The M5StickC Plus 2 acts as a **Standalone Socket.io Worker**. It connects directly to the Dashboard via Wi-Fi and uses Bluetooth (BLE HID) to automate interactions on any host computer it is connected to.

---

## 🛠️ Implementation Strategy

### 1. Standalone Connectivity
- **Protocol:** Socket.io (C++ Client)
- **Transport:** Wi-Fi (802.11 b/g/n)
- **Role:** The device registers itself as a `worker` using the `CLI_AGENTS_SECRET_KEY`.
- **Dashboard Integration:** It receives `worker-chat-message` events and emits `worker-agent-response` events, just like the Node.js agent.

### 2. Auto-Run Mechanism (HID Trigger)
- **Method:** BLE Keyboard (Bluetooth Low Energy)
- **Trigger:** Physical Button A (Main M5 Button)
- **Action:** When pressed, the device simulates a "Web Home" key or types the Dashboard URL + Enter.
- **Benefit:** Opens the agent interface on any paired computer without installing software.

### 3. On-Device Interface
- **Screen:** 1.14" LCD shows connection status, Wi-Fi signal, and snippets of the current chat.
- **LED/Buzzer:** Can be programmed to flash or beep when a new message arrives or when the agent finishes "thinking."

---

## 📜 Firmware Template (Arduino/C++)

```cpp
#include <M5StickCPlus2.h>
#include <WiFi.h>
#include <SocketIoClient.h>
#include <BleKeyboard.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// --- Configuration ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-dashboard-url.com"; 
const char* secretKey = "YOUR_CLI_AGENTS_SECRET_KEY";
const char* geminiApiKey = "YOUR_GOOGLE_GEMINI_API_KEY";

SocketIoClient socket;
BleKeyboard bleKeyboard("Agent Stick", "M5Stack", 100);

// --- State ---
String currentAgentId = "";

void onChat(const char* payload, size_t length) {
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, payload);
    const char* message = doc["message"];
    currentAgentId = doc["agentId"].as<String>();
    
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setCursor(0, 0);
    M5.Lcd.printf("User: %s\n", message);
    
    // Process via Gemini API
    String response = callGemini(message);
    
    // Return to Dashboard
    DynamicJsonDocument respDoc(1024);
    respDoc["agentId"] = currentAgentId;
    respDoc["text"] = response;
    String output;
    serializeJson(respDoc, output);
    socket.emit("worker-agent-response", output.c_str());
}

String callGemini(String prompt) {
    HTTPClient http;
    String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + String(geminiApiKey);
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    String jsonPayload = "{\"contents\": [{\"parts\":[{\"text\":\"" + prompt + "\"}]}]}";
    int httpResponseCode = http.POST(jsonPayload);
    String response = "Error calling API";
    if (httpResponseCode > 0) {
        String payload = http.getString();
        DynamicJsonDocument doc(4096);
        deserializeJson(doc, payload);
        response = doc["candidates"][0]["content"]["parts"][0]["text"].as<String>();
    }
    http.end();
    return response;
}

void setup() {
    M5.begin();
    M5.Lcd.setRotation(1);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) { delay(500); M5.Lcd.print("."); }
    bleKeyboard.begin();
    socket.on("worker-chat-message", onChat);
    socket.begin(serverUrl);
    String auth = "{\"secret\":\"" + String(secretKey) + "\"}";
    socket.emit("register-worker", auth.c_str());
}

void loop() {
    M5.update();
    socket.loop();
    if (M5.BtnA.wasPressed() && bleKeyboard.isConnected()) {
        bleKeyboard.print(serverUrl);
        bleKeyboard.write(KEY_RETURN);
    }
}
```

---

## 🔄 Future Update Roadmap
1. **Local Proxy Mode:** Allow the M5StickC to tunnel commands to a local Node.js instance if file system access is needed.
2. **IMU Shortcuts:** Tilt the device left/right to switch between different agent skills (Architect, BugHunter, etc.).
3. **Battery Optimization:** Implement deep-sleep modes to allow the agent to stay "on-call" for days.
4. **Enhanced Security:** Move keys to the ESP32's Secure Vault (NVS) instead of hardcoding.
