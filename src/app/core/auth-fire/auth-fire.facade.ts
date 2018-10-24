import { Injectable, NgZone } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from '../local-storage/local-storage.service';

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument
} from '@angular/fire/firestore';

import { Observable, pipe, of, from, defer } from 'rxjs';
import {
  map,
  catchError,
  switchMap,
  concatMap,
  tap,
  take
} from 'rxjs/operators';

import { AppState } from '../core.state';
import { User } from './auth-fire.model';
import { UsersQuery } from './auth-fire.reducer';

import * as userActions from './auth-fire.actions';
type Action = userActions.All;

export const AUTH_KEY = 'AUTH-FIRE';

@Injectable()
export class UserFacade {
  // ************************************************
  // Observable Queries available for consumption by views
  // ************************************************
  user$ = this.store.pipe(select(UsersQuery.getUser));
  formUserName: string;

  // ************************************************
  // Effects to be registered at the Module level
  // ************************************************
  @Effect()
  getUser$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GET_USER),
    pipe(
      map((action: userActions.GetUser) => action.payload),
      switchMap(payload => this.afAuth.authState),
      map(authData => {
        if (authData) {
          console.log('getUser$: User is LOGGED IN');
          const authProviderId = authData.providerData[0].providerId.replace(
            '.com',
            ''
          );
          console.log('getUser$: User PROVIDER ID: ' + authProviderId);

          const user = new User(
            authData.uid,
            authData.email || null,
            authData.displayName || null,
            authData.photoURL || 'https://angularfirebase.com/images/logo.png',
            authData.phoneNumber || null,
            authProviderId,
            authData.emailVerified
          );
          return new userActions.Authenticated(user);
        } else {
          console.log('getUser$: User is NOT LOGGED IN');
          return new userActions.NotAuthenticated();
        }
      }),
      catchError((err, caught) => {
        this.store.dispatch(new userActions.AuthError({ error: err.message }));
        return caught;
      })
    )
  );

  /**
   * Sign Up with Email Address and password
   */
  @Effect()
  signUpEmail$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.EMAIL_SIGN_UP),
    pipe(
      map((action: userActions.EmailSignUp) => action.payload),
      switchMap(payload => {
        console.log('signUpEmail$ action > Payload EMAIL: ' + payload.email);
        const formPayload = payload;
        this.formUserName = formPayload.name;
        return from(this.emailSignUp(formPayload.email, formPayload.password));
      }),
      map(credential => {
        console.log(
          'signUpEmail$ action SUCCESS > New UID: ' + credential.user.uid
        );
        console.log('signUpEmail$ get FORM USER NAME: ' + this.formUserName);

        const userDisplayName = this.formUserName ? this.formUserName : '';

        const payload = {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: userDisplayName,
          photoUrl: 'https://angularfirebase.com/images/logo.png',
          phoneNumber: '',
          providerId: 'password',
          verified: false
        };

        return new userActions.LoginSuccess(payload);
      }),
      catchError((err, caught) => {
        this.store.dispatch(new userActions.AuthError({ error: err.code }));
        return caught;
      })
    )
  );

  /**
   * Login with Email Address and password
   */
  @Effect()
  loginEmail$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.EMAIL_LOGIN),
    pipe(
      map((action: userActions.EmailLogin) => action.payload),
      switchMap(payload => {
        console.log('loginEmail$ action > Payload EMAIL: ' + payload.email);
        return from(this.emailLogin(payload.email, payload.password));
      }),
      map(credential => {
        console.log('loginEmail$ success > uid: ' + credential.user.uid);

        const payload = {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          photoUrl:
            credential.user.displayName ||
            'https://angularfirebase.com/images/logo.png',
          phoneNumber: credential.user.phoneNumber,
          providerId: 'password',
          verified: credential.user.emailVerified
        };

        return new userActions.LoginSuccess(payload);
      }),
      catchError((err, caught) => {
        this.store.dispatch(new userActions.AuthError({ error: err.code }));
        return caught;
      })
    )
  );

  /**
   * Login with Google OAuth
   */
  @Effect()
  loginGoogle$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GOOGLE_LOGIN),
    pipe(
      map((action: userActions.GoogleLogin) => action.payload),
      switchMap(payload => {
        console.log('loginGoogle$ action ATTEMPT');
        return from(this.googleLogin());
      }),
      map(credential => {
        console.log(
          'loginGoogle$ action SUCCESS > uid: ' + credential.user.uid
        );

        const payload = {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: credential.user.displayName,
          photoUrl:
            credential.user.displayName ||
            'https://angularfirebase.com/images/logo.png',
          phoneNumber: credential.user.phoneNumber,
          providerId: 'google',
          verified: credential.user.emailVerified
        };

        return new userActions.LoginSuccess(payload);
      }),
      catchError((err, caught) => {
        this.store.dispatch(new userActions.AuthError({ error: err.code }));
        return caught;
      })
    )
  );

  @Effect({ dispatch: false })
  loginSuccess$ = this.actions$.pipe(
    ofType(userActions.LOGIN_SUCCESS),
    map((action: userActions.LoginSuccess) => action.payload),
    tap(payload => {
      console.log('loginSuccess$ action > [payload.uid]: ' + payload.uid);
      console.log('loginSuccess$ > router.navigate > user/home');

      this.zone.run(() => {
        this.router.navigate(['user/home']);
      });

      console.log('loginSuccess$ > local Storage > set Item');
      this.localStorageService.setItem(AUTH_KEY, payload);
    })
  );

  @Effect()
  logout$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.LOGOUT_USER),
    pipe(
      map((action: userActions.LogoutUser) => action.payload),
      switchMap(payload => {
        console.log('logout$ afAuth userAction');
        return of(this.afAuth.auth.signOut());
      }),
      map(authData => {
        return new userActions.LogoutSuccess();
      }),
      catchError((err, caught) => {
        of(new userActions.AuthError({ error: err.code }));
        return caught;
      })
    )
  );

  @Effect({ dispatch: false })
  logoutSuccess$ = this.actions$.pipe(
    ofType(userActions.LOGOUT_SUCCESS),
    tap(() => {
      console.log('logoutSuccess$ > about/');
      // this.showNotification(successLogoutMsg, '');
      this.zone.run(() => {
        this.router.navigate(['']);
      });
    })
  );

  @Effect({ dispatch: false })
  init$: Observable<any> = defer(() => {
    console.log('init$ Effect > GetUser action');
    this.store.dispatch(new userActions.GetUser());
  });

  // ************************************************
  // Internal Code
  // ************************************************
  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private router: Router,
    private zone: NgZone,
    private snackBar: MatSnackBar,
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private translateService: TranslateService,
    private localStorageService: LocalStorageService
  ) {}

  signUpEmail(email: string, password: string, name: string): Observable<User> {
    const payload = {
      email: email,
      password: password,
      name: name
    };
    this.store.dispatch(new userActions.EmailSignUp(payload));
    return this.user$;
  }

  loginEmail(email: string, password: string): Observable<User> {
    const payload = {
      email: email,
      password: password
    };
    this.store.dispatch(new userActions.EmailLogin(payload));
    return this.user$;
  }

  loginGoogle(): Observable<User> {
    this.store.dispatch(new userActions.GoogleLogin());
    return this.user$;
  }

  loginFacebook(): Observable<User> {
    this.store.dispatch(new userActions.FacebookLogin());
    return this.user$;
  }

  loginTwitter(): Observable<User> {
    this.store.dispatch(new userActions.TwitterLogin());
    return this.user$;
  }

  loginGithub(): Observable<User> {
    this.store.dispatch(new userActions.GithubLogin());
    return this.user$;
  }

  logoutUser(): Observable<User> {
    this.store.dispatch(new userActions.LogoutUser());
    return this.user$;
  }

  resetPassRedirect(): void {
    console.log('resetPassRedirect triggered!');
    this.router.navigate(['account/reset']);
  }

  signUpRedirect(): void {
    console.log('signUpRedirect triggered!');
    this.router.navigate(['account/register']);
  }

  loginRedirect(): void {
    console.log('loginRedirect triggered!');
    this.router.navigate(['account/login']);
  }

  // ******************************************
  // Internal Methods
  // ******************************************

  protected emailSignUp(email: string, password: string): Promise<any> {
    const newEmail = email;
    const newPass = password;
    return this.afAuth.auth.createUserWithEmailAndPassword(newEmail, newPass);
  }

  protected emailLogin(email: string, password: string): Promise<any> {
    const newEmail = email;
    const newPass = password;
    return this.afAuth.auth.signInWithEmailAndPassword(newEmail, newPass);
  }

  protected googleLogin(): Promise<any> {
    const provider = new auth.GoogleAuthProvider();
    return this.afAuth.auth.signInWithPopup(provider);
  }

  protected facebookLogin(): Promise<any> {
    const provider = new auth.FacebookAuthProvider();
    return this.afAuth.auth.signInWithPopup(provider);
  }

  protected twitterLogin(): Promise<any> {
    const provider = new auth.TwitterAuthProvider();
    return this.afAuth.auth.signInWithPopup(provider);
  }

  protected githubLogin(): Promise<any> {
    const provider = new auth.GithubAuthProvider();
    return this.afAuth.auth.signInWithPopup(provider);
  }
}
