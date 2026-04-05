production build and submit to app store
`eas build -p ios --auto-submit`

development build for ios simulator using eas
`eas build --profile development-simulator --platform ios`

development build for ios device using eas
`eas build --profile development --platform ios`

development build for ios local
`npx expo prebuild --clean && npx expo run:ios --device`
