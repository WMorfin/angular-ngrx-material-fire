const packageJson = require('../../package.json');

export const environment = {
  appName: 'Angular Ngrx Material Fire',
  envName: 'TEST',
  production: false,
  test: true,
  i18nPrefix: '',
  versions: {
    app: packageJson.version,
    angular: packageJson.dependencies['@angular/core'],
    ngrx: packageJson.dependencies['@ngrx/store'],
    material: packageJson.dependencies['@angular/material'],
    bootstrap: packageJson.dependencies.bootstrap,
    rxjs: packageJson.dependencies.rxjs,
    ngxtranslate: packageJson.dependencies['@ngx-translate/core'],
    fontAwesome:
      packageJson.dependencies['@fortawesome/fontawesome-free-webfonts'],
    angularCli: packageJson.devDependencies['@angular/cli'],
    typescript: packageJson.devDependencies['typescript'],
    cypress: packageJson.devDependencies['cypress']
  },
  firebaseConfig: {
    apiKey: 'AIzaSyDhSRYCtnQCfWF1NBuQGDv8Kk2QOUb0jSA',
    authDomain: 'guatedev-platform.firebaseapp.com',
    databaseURL: 'https://guatedev-platform.firebaseio.com',
    projectId: 'guatedev-platform',
    storageBucket: 'guatedev-platform.appspot.com',
    messagingSenderId: '1072313633743'
  }
};
