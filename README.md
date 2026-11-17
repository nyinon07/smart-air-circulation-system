# AEROFLOW Firebase-connected frontend

## Before publishing
1. Open `script.js`.
2. Replace `PASTE_YOUR_API_KEY`, `PASTE_YOUR_MESSAGING_SENDER_ID`, and `PASTE_YOUR_APP_ID` with the exact values from Firebase Console > Project settings > Your apps > Config.
3. Confirm `databaseURL` matches the URL shown in Realtime Database.
4. Commit the updated files to your GitHub repository.

## Firebase setup
- Enable Authentication > Email/Password.
- Create your administrator user in Authentication > Users.
- In Realtime Database > Rules, use rules restricted to your administrator UID.
- Do not use public read/write rules.

## Database paths expected
- `sensors/temperature`
- `sensors/humidity`
- `sensors/airVelocity`
- `ventilation/command`
- `ventilation/mode`
- `ventilation/actualState`
- `devices/master`, `devices/slave1`, `devices/slave2`

The page reads these paths and writes only `ventilation/command` and `ventilation/mode` when the administrator uses the controls. The physical fan will not operate until an ESP32 is programmed to listen for commands and update `actualState`.

## Important
This frontend uses Firebase's browser module SDK from Google's CDN. It does not require npm or a build tool. Keep your Firebase Realtime Database rules locked to authenticated users. Never publish an administrator password or private service-account credentials.
