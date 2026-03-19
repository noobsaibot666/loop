# LOOP Mobile Release Readiness

Date: 2026-03-19

Use this as the high-level go / no-go sheet for mobile releases.

## Product
- [x] all V1 parity features implemented
- [x] no web-only rider flow is accidentally missing from mobile
- [x] admin intentionally excluded

## Native behavior
- [x] session restore implemented
- [x] background / foreground recovery implemented
- [ ] location permission copy is clear
- [ ] camera permission copy is clear
- [ ] hardware back behavior is correct on Android
- [x] deep links open the right route

## Backend and data
- [x] mobile billing verification path implemented
- [ ] mobile billing verification path tested end-to-end with live store events
- [ ] upload validation tested with native media
- [ ] all SQL migrations applied manually if required
- [x] migration notes stored in docs/mobile

## Store prep
- [ ] app icon and splash assets prepared
- [ ] support contact defined
- [ ] privacy policy URL confirmed
- [ ] terms URL confirmed
- [ ] screenshots prepared
- [ ] release notes prepared

## Android
- [x] internal test build generated locally and installed on emulator
- [ ] internal test build installed on real device
- [ ] Play Store metadata ready
- [ ] release signing configured

## iOS
- [ ] TestFlight build installed on real device
- [ ] App Store metadata ready
- [ ] signing and capabilities configured
