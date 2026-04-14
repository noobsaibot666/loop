# Google Play Store Listing & Assets

## 1. Marketing Copy
- **App Title**: Loop
- **Short Description**: Flow with the City. Navigation for messengers.
- **Full Description**:
  Loop is the ultimate tool for urban explorers and professional bike messengers. Designed for the high-speed, high-stakes environment of city navigation, Loop provides a seamless interface for coordinating rides, managing equipment setups, and tracking your "night-ride" history.
- **Release Notes**: Initial launch of the Loop Coordination Suite.
- **Contact Email**: [SUPPORT_EMAIL]

## 2. Technical Asset Requirements
| Asset Name | Required Size | Format | Quantity |
| :--- | :--- | :--- | :--- |
| **App Icon** | 512 x 512 px | PNG (32-bit) | 1 |
| **Feature Graphic** | 1024 x 500 px | PNG/JPG | 1 |
| **Phone Screenshots** | min 320px | PNG/JPG | 2-8 |
| **7-inch Tablet** | min 320px | PNG/JPG | Optional |
| **10-inch Tablet** | min 320px | PNG/JPG | Optional |

## 3. Data Safety Requirements
- **Data Collection**: Declare email address, device ID, and app interactions.
- **Data Encryption**: Declare all data is transferred over a secure HTTPS connection.
- **Deletion Policy**: Declare that users can request account and data deletion.

## 4. Deployment Notes
- Build with `eas build -p android`.
- Upload `.aab` (Android App Bundle) to the Production track.
- Ensure "Data Safety" form is completed in Google Play Console.
