# Loop Store Submission Guide

This guide outlines the steps to submit Loop to the Apple App Store and Google Play Store.

## 📦 Prerequisites
- **Apple**: Active Apple Developer Account ($99/year).
- **Google**: Active Google Play Console Account ($25 one-time).
- **Legal**: Use the generated `LICENSE`, `PRIVACY_POLICY.md`, and `TERMS_OF_SERVICE.md`.

## 🍎 Apple App Store (App Store Connect)
1.  **Create App Record**: Go to App Store Connect > My Apps > (+) New App.
2.  **Metadata**:
    - **Name**: Loop
    - **Subtitle**: Professional Messenger Suite
    - **Category**: Navigation / Business
3.  **App Privacy**:
    - Link to `PRIVACY_POLICY.md` (host it on your website).
    - Disclose "Contact Info" and "Usage Data" collection.
4.  **TestFlight**: Upload your build from Expo/EAS (`eas build -p ios`).
5.  **Review Information**:
    - Provide a demo account (Username/Password).
    - Note the "Account Deletion" feature in Settings for reviewer compliance.

## 🤖 Google Play Store (Play Console)
1.  **Create App**: Click "Create app" and choose "App" (not Game).
2.  **App Content**:
    - **Privacy Policy**: Add the link to your policy.
    - **Data Safety**: Declare that data is encrypted in transit and users can request deletion.
3.  **Store Listing**:
    - **Short Description**: The professional suite for bike messengers and night-riders.
    - **Full Description**: Use the copy from `MARKETING_COPY.md`.
4.  **Production Track**: Upload your AAB file (`eas build -p android`).

## ✅ Compliance Checklist
- [ ] **Account Deletion**: Ensure the `/api/account/delete` endpoint is functional.
- [ ] **Legal Placeholders**: Replace all `[LEGAL_ENTITY_NAME]` and `[SUPPORT_EMAIL]` in legal docs.
- [ ] **In-App Purchases**: Configure IAP IDs for credits in both consoles.
