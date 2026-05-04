# 🤖 M5StickC Plus 2: Hardware Agent Guide

This guide explains how to turn your M5StickC Plus 2 into a **Standalone Hardware Agent** that connects to your CLI Agents HQ Dashboard over Wi-Fi, removing the need to download the `agent.js` folder on every machine.

## 🌟 Key Features
1.  **Standalone Worker:** The device connects to your Dashboard as a verified worker.
2.  **BLE HID Auto-Run:** When powered on, the device acts as a Bluetooth Keyboard to automatically "type" the Dashboard URL on your computer.
3.  **On-Device Chat:** View agent status and small messages directly on the 1.14" LCD.
4.  **No PC Installation:** All logic lives on the ESP32.

---

## 🛠️ Prerequisites
- **Arduino IDE** with M5Stack board support installed.
- **Libraries:**
    - `M5StickCPlus2`
    - `SocketIoClient` (by Markus Sattler)
    - `WebSockets` (by Markus Sattler)
    - `ESP32 BLE Keyboard` (by T-vK)
    - `ArduinoJson`

---

## 📜 Firmware Strategy (Arduino Sketch)

Below is a template for the firmware. You will need to fill in your Wi-Fi credentials, Server URL, and Secret Key.

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
const char* serverUrl = "http://your-dashboard-url.com"; // IP or Domain
const char* secretKey = "YOUR_CLI_AGENTS_SECRET_KEY";
const char* geminiApiKey = "YOUR_GOOGLE_GEMINI_API_KEY";

SocketIoClient socket;
BleKeyboard bleKeyboard("Agent Stick", "M5Stack", 100);

// --- State ---
bool isConnected = false;
String currentAgentId = "";

void onChat(const char* payload, size_t length) {
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, payload);
    
    const char* message = doc["message"];
    currentAgentId = doc["agentId"].as<String>();
    
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.setCursor(0, 0);
    M5.Lcd.println("User: ");
    M5.Lcd.println(message);
    
    // Call Gemini API and return response
    String response = callGemini(message);
    
    // Send back to Dashboard
    DynamicJsonDocument respDoc(1024);
    respDoc["agentId"] = currentAgentId;
    respDoc["text"] = response;
    
    String output;
    serializeJson(respDoc, output);
    socket.emit("worker-agent-response", output.c_str());
}

String callGemini(String prompt) {
    // Simplified Gemini API Call
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
    M5.Lcd.setTextSize(2);
    
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        M5.Lcd.print(".");
    }
    
    M5.Lcd.fillScreen(BLACK);
    M5.Lcd.println("Wi-Fi OK");
    
    bleKeyboard.begin();
    
    socket.on("worker-chat-message", onChat);
    socket.begin(serverUrl);
    
    // Auth with Dashboard
    String auth = "{\"secret\":\"" + String(secretKey) + "\"}";
    socket.emit("register-worker", auth.c_str());
}

void loop() {
    M5.update();
    socket.loop();
    
    // If Button A is pressed, act as keyboard to open Dashboard
    if (M5.BtnA.wasPressed()) {
        if (bleKeyboard.isConnected()) {
            M5.Lcd.println("Launching URL...");
            bleKeyboard.write(KEY_MEDIA_WWW_HOME); // or type the URL
            delay(500);
            bleKeyboard.print(serverUrl);
            bleKeyboard.write(KEY_RETURN);
        } else {
            M5.Lcd.println("BLE Not Connected");
        }
    }
}
```

---

## 🚀 How to use
1.  **Flash the firmware:** Upload the sketch above to your M5StickC Plus 2.
2.  **Pair Bluetooth:** On your computer, look for "Agent Stick" and pair it.
3.  **Deploy:** Your M5StickC will now automatically connect to your Dashboard over Wi-Fi.
4.  **Auto-Run:** When you plug the stick into a computer (or just have it nearby), press **Button A**. It will "type" the Dashboard URL and hit Enter, opening your agent interface instantly.

---

## ⚠️ Important Considerations
- **Gemini CLI Features:** The M5StickC runs a simplified version of the agent. It does not have access to your local file system (C:\...) like the Node.js agent does. It is best used for **Brainstorming, Chatting, and Remote Control**.
- **Memory Limits:** The ESP32 has limited RAM. Large chat histories might cause crashes. The template above uses `DynamicJsonDocument` with fixed sizes; adjust as needed.
- **Security:** Your `secretKey` and `geminiApiKey` are stored in plain text on the device. Ensure you don't share your firmware binaries publicly.
