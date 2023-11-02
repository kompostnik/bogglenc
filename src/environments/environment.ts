// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  backendPath: "http://127.0.0.1:5001/bogglenc-feature/europe-west1",
  firebase: {
    apiKey: "AIzaSyAFg6_7oES8PFd5Tq-wLMEKfHDNwPKK5Co",
    authDomain: "bogglenc-feature.firebaseapp.com",
    projectId: "bogglenc-feature",
    storageBucket: "bogglenc-feature.appspot.com",
    messagingSenderId: "612282792652"
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
