/*
 * This example checks if the firmware loaded on the NINA module
 * is updated.
 *
 * Circuit:
 * - Board with NINA module (Arduino MKR WiFi 1010, MKR VIDOR 4000 and UNO WiFi Rev.2)
 *
 * Created 17 October 2018 by Riccardo Rosario Rizzo
 * This code is in the public domain.
 */
#include <SPI.h>
#include <WiFiNINA.h>

void setup()
{
  // Initialize serial
  Serial.begin(9600);
  while (!Serial)
  {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE)
  {
    Serial.println("ERROR: Communication with WiFi module failed!");
    // don't continue
    while (true)
      ;
  }

  // Print firmware version on the module
  String fv = WiFi.firmwareVersion();
  String latestFv;
  Serial.println(fv);

  Serial.println("done");
}

void loop() {}
