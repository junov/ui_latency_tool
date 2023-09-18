#include <Mouse.h>

void setup() {
  Serial.begin(9600);
  Mouse.begin();
}

bool time_next_command = false;

void loop() {
  while (Serial.available() > 0) {

    char command = Serial.read();
    if (command == 't') {
      time_next_command = true;
      continue;
    }
    int value = Serial.parseInt(SKIP_WHITESPACE);
    switch(command) {
      case 'l':
        if (value) {
          Serial.printf("Pressing left mouse button.\n");
          Mouse.press(MOUSE_LEFT);
        } else {
          Serial.printf("Releasing left mouse button.\n");
          Mouse.release(MOUSE_LEFT);
        }
        break;
      case 'r':
        if (value) {
          Serial.printf("Pressing right mouse button.\n");
          Mouse.press(MOUSE_RIGHT);
        } else {
          Serial.printf("Releasing right mouse button.\n");
          Mouse.release(MOUSE_RIGHT);
        }
        break;
      case 'm':
        if (value) {
          Serial.printf("Pressing middle mouse button.\n");
          Mouse.press(MOUSE_MIDDLE);
        } else {
          Serial.printf("Releasing middle mouse button.\n");
          Mouse.release(MOUSE_MIDDLE);
        }
        break;
      case 'x':
        Serial.printf("Moving mouse by %d horizontally.\n", value);
        Mouse.move(value, 0, 0);
        break;
      case 'y':
        Serial.printf("Moving mouse by %d vertically.\n", value);
        Mouse.move(0, value, 0);
        break;
      case 'w':
        Serial.printf("Moving mouse wheel by %d.\n", value);
        Mouse.move(0, 0, value);
        break;
      case 'd':
        Serial.printf("Waiting %d milliseconds.\n", value);
        delay(value);
        break;
      default:
        // ignore unrecognized characters, whitespaces, etc.
        continue;
    }  // switch (command)
    if (time_next_command) {
      time_next_command = false;
    }
  }
  
}
