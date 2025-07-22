/**
 * Kode Arduino untuk Sistem Manajemen Batching Plant PT. FARIKA RIAU PERKASA
 * 
 * Arsitektur:
 * 1. Aplikasi Web (HMI) <--> Agent Lokal di PC (Node.js/Python) <--> Arduino
 * 2. Indikator Timbangan Fisik --> Arduino
 * 
 * Tugas Arduino:
 * - Menerima perintah kontrol relay (misalnya, buka/tutup pintu) dari Agent Lokal melalui port Serial.
 * - Membaca data berat yang sudah diproses dari Indikator Timbangan Fisik melalui port Serial1.
 * - Meneruskan data berat tersebut ke Agent Lokal melalui port Serial.
 * 
 * Komunikasi:
 * - Serial (Pin 0, 1): Terhubung ke PC/Agent Lokal untuk perintah & data.
 * - Serial1 (Pin 19, 18): Terhubung ke output serial dari Indikator Timbangan.
 */

#include <ArduinoJson.h> // Library untuk JSON Parsing

// --- Konfigurasi Pin Relay ---
// Contoh pemetaan relayId ke pin di Arduino Mega 2560

// Aggregate (Pin Digital)
#define RELAY_PASIR1_PIN      22
#define RELAY_PASIR2_PIN      23
#define RELAY_BATU1_PIN       24
#define RELAY_BATU2_PIN       25

// Air (Pin Digital)
#define RELAY_AIR_TIMBANG_PIN 26
#define RELAY_AIR_BUANG_PIN   27

// Semen (Pin Digital)
#define RELAY_SEMEN_TIMBANG_PIN 28
#define RELAY_SEMEN_BUANG_PIN   29

// Mixer (Pin Digital)
#define RELAY_PINTU_BUKA_PIN  30
#define RELAY_PINTU_TUTUP_PIN 31

// Konveyor (Pin Digital)
#define RELAY_KONVEYOR_BAWAH_PIN 32
#define RELAY_KONVEYOR_ATAS_PIN  33

// Sistem (Pin Digital)
#define RELAY_KLAKSON_PIN     34

// Silo Selection (Pin Digital)
#define RELAY_SILO1_PIN       35
#define RELAY_SILO2_PIN       36
#define RELAY_SILO3_PIN       37
#define RELAY_SILO4_PIN       38
#define RELAY_SILO5_PIN       39
#define RELAY_SILO6_PIN       40


// --- Variabel Global Lainnya ---
// Ukuran buffer untuk JSON parsing. Sesuaikan jika pesan JSON lebih besar.
const size_t JSON_DOC_SIZE = 256; 

// Array untuk menyimpan pin silo agar mudah diakses
const int SILO_PINS[] = {
  RELAY_SILO1_PIN, RELAY_SILO2_PIN, RELAY_SILO3_PIN,
  RELAY_SILO4_PIN, RELAY_SILO5_PIN, RELAY_SILO6_PIN
};
const int NUM_SILOS = sizeof(SILO_PINS) / sizeof(SILO_PINS[0]);

void setup() {
  // Inisialisasi komunikasi serial dengan PC (Agent Lokal)
  Serial.begin(9600); 
  while (!Serial) { ; } // Tunggu port serial terhubung. Penting untuk beberapa board Arduino.

  // Inisialisasi komunikasi serial dengan Indikator Timbangan
  // PASTIKAN BAUD RATE SAMA DENGAN PENGATURAN PADA INDIKATOR TIMBANGAN ANDA
  Serial1.begin(9600); 

  // --- Inisialisasi Pin Relay ---
  Serial.println("Inisialisasi semua pin relay...");
  
  // Aggregate
  pinMode(RELAY_PASIR1_PIN, OUTPUT);      digitalWrite(RELAY_PASIR1_PIN, LOW);
  pinMode(RELAY_PASIR2_PIN, OUTPUT);      digitalWrite(RELAY_PASIR2_PIN, LOW);
  pinMode(RELAY_BATU1_PIN, OUTPUT);       digitalWrite(RELAY_BATU1_PIN, LOW);
  pinMode(RELAY_BATU2_PIN, OUTPUT);       digitalWrite(RELAY_BATU2_PIN, LOW);

  // Air
  pinMode(RELAY_AIR_TIMBANG_PIN, OUTPUT); digitalWrite(RELAY_AIR_TIMBANG_PIN, LOW);
  pinMode(RELAY_AIR_BUANG_PIN, OUTPUT);   digitalWrite(RELAY_AIR_BUANG_PIN, LOW);

  // Semen
  pinMode(RELAY_SEMEN_TIMBANG_PIN, OUTPUT); digitalWrite(RELAY_SEMEN_TIMBANG_PIN, LOW);
  pinMode(RELAY_SEMEN_BUANG_PIN, OUTPUT);   digitalWrite(RELAY_SEMEN_BUANG_PIN, LOW);

  // Mixer
  pinMode(RELAY_PINTU_BUKA_PIN, OUTPUT);  digitalWrite(RELAY_PINTU_BUKA_PIN, LOW);
  pinMode(RELAY_PINTU_TUTUP_PIN, OUTPUT); digitalWrite(RELAY_PINTU_TUTUP_PIN, LOW);

  // Konveyor
  pinMode(RELAY_KONVEYOR_BAWAH_PIN, OUTPUT); digitalWrite(RELAY_KONVEYOR_BAWAH_PIN, LOW);
  pinMode(RELAY_KONVEYOR_ATAS_PIN, OUTPUT);  digitalWrite(RELAY_KONVEYOR_ATAS_PIN, LOW);

  // Sistem
  pinMode(RELAY_KLAKSON_PIN, OUTPUT);    digitalWrite(RELAY_KLAKSON_PIN, LOW);

  // Inisialisasi Pin Silo
  for (int i = 0; i < NUM_SILOS; i++) {
    pinMode(SILO_PINS[i], OUTPUT);
    digitalWrite(SILO_PINS[i], LOW); // Pastikan semua silo OFF di awal
  }
  
  // Asumsi: Relay Anda adalah active-high, artinya HIGH = ON, LOW = OFF. Jika tidak, sesuaikan di semua digitalWrite().
  Serial.println("Arduino Mega 2560 siap! Menunggu perintah dan membaca data dari indikator timbangan...");
}

void loop() {
  // --- Bagian Membaca Data Berat dari Indikator Timbangan (Serial1) ---
  if (Serial1.available()) {
    // Baca data dari indikator. Format data tergantung pada indikator Anda.
    // Biasanya berupa string angka yang diakhiri dengan newline. Contoh: "123.45\n"
    String weightString = Serial1.readStringUntil('\n');
    weightString.trim(); // Hapus spasi atau karakter tidak terlihat

    // Kirim data ini ke PC/Agent dalam format JSON yang sudah disepakati
    StaticJsonDocument<100> docWeight;
    docWeight["type"] = "weight"; 
    // Anda mungkin perlu mengirim data dari beberapa timbangan, sesuaikan key JSON di sini.
    // Contoh untuk satu timbangan "aggregate":
    docWeight["aggregate"] = weightString.toFloat(); 
    // Contoh untuk beberapa timbangan:
    // docWeight["semen"] = ... (jika ada timbangan semen)
    // docWeight["air"] = ... (jika ada timbangan air)
    
    serializeJson(docWeight, Serial);
    Serial.println(); // Penting: Tambahkan newline sebagai delimiter pesan
  }

  // --- Bagian Menerima dan Memproses Perintah JSON dari PC/Agent (Serial) ---
  if (Serial.available()) {
    String jsonString = Serial.readStringUntil('\n'); // Baca string sampai karakter newline
    
    StaticJsonDocument<JSON_DOC_SIZE> docCommand;
    DeserializationError error = deserializeJson(docCommand, jsonString);

    if (error) {
      Serial.print(F("deserializeJson() gagal: "));
      Serial.println(error.f_str());
      return;
    }

    const char* command = docCommand["command"];

    if (command) {
      handleRelayCommand(docCommand, command);
      handleSiloCommand(docCommand, command);
      // Tambahkan handler untuk command lain jika ada
    } else {
      Serial.println("Error: 'command' field tidak ditemukan di JSON.");
    }
  }
}

// Fungsi untuk menangani perintah SET_RELAY
void handleRelayCommand(const JsonDocument& doc, const char* command) {
  if (strcmp(command, "SET_RELAY") != 0) return;

  const char* relayId = doc["relayId"];
  bool state = doc["state"];

  int targetPin = getPinFromRelayId(relayId);

  if (targetPin != -1) {
    digitalWrite(targetPin, state ? HIGH : LOW);
    // Serial.print("Relay "); Serial.print(relayId); Serial.print(" (Pin ");
    // Serial.print(targetPin); Serial.print(") set to "); Serial.println(state ? "HIGH" : "LOW");
  } else {
    Serial.print("Error: relayId tidak dikenal: ");
    Serial.println(relayId);
  }
}

// Fungsi untuk menangani perintah SELECT_SILO
void handleSiloCommand(const JsonDocument& doc, const char* command) {
  if (strcmp(command, "SELECT_SILO") != 0) return;

  const char* siloId = doc["siloId"];
  int selectedSiloIndex = getIndexFromSiloId(siloId);

  if (selectedSiloIndex != -1) {
    for (int i = 0; i < NUM_SILOS; i++) {
      digitalWrite(SILO_PINS[i], (i == selectedSiloIndex) ? HIGH : LOW);
    }
    // Serial.print("Silo "); Serial.print(siloId); Serial.println(" Activated.");
  } else {
    Serial.print("Error: siloId tidak dikenal: ");
    Serial.println(siloId);
  }
}

// Helper function untuk memetakan relayId ke pin
int getPinFromRelayId(const char* relayId) {
  if (strcmp(relayId, "pasir1") == 0) return RELAY_PASIR1_PIN;
  if (strcmp(relayId, "pasir2") == 0) return RELAY_PASIR2_PIN;
  if (strcmp(relayId, "batu1") == 0) return RELAY_BATU1_PIN;
  if (strcmp(relayId, "batu2") == 0) return RELAY_BATU2_PIN;
  if (strcmp(relayId, "airTimbang") == 0) return RELAY_AIR_TIMBANG_PIN;
  if (strcmp(relayId, "airBuang") == 0) return RELAY_AIR_BUANG_PIN;
  if (strcmp(relayId, "semenTimbang") == 0) return RELAY_SEMEN_TIMBANG_PIN;
  if (strcmp(relayId, "semen") == 0) return RELAY_SEMEN_BUANG_PIN; // Note: semen is buang
  if (strcmp(relayId, "pintuBuka") == 0) return RELAY_PINTU_BUKA_PIN;
  if (strcmp(relayId, "pintuTutup") == 0) return RELAY_PINTU_TUTUP_PIN;
  if (strcmp(relayId, "konveyorBawah") == 0) return RELAY_KONVEYOR_BAWAH_PIN;
  if (strcmp(relayId, "konveyorAtas") == 0) return RELAY_KONVEYOR_ATAS_PIN;
  if (strcmp(relayId, "klakson") == 0) return RELAY_KLAKSON_PIN;
  return -1; // Pin tidak ditemukan
}

// Helper function untuk memetakan siloId ke index
int getIndexFromSiloId(const char* siloId) {
  if (strcmp(siloId, "silo1") == 0) return 0;
  if (strcmp(siloId, "silo2") == 0) return 1;
  if (strcmp(siloId, "silo3") == 0) return 2;
  if (strcmp(siloId, "silo4") == 0) return 3;
  if (strcmp(siloId, "silo5") == 0) return 4;
  if (strcmp(siloId, "silo6") == 0) return 5;
  return -1; // Index tidak ditemukan
}
