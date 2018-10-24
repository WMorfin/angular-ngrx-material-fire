import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@app/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { UserFacade } from '../../core/auth-fire/auth-fire.facade';
import { User } from '../../core/auth-fire/auth-fire.model';

@Component({
  selector: 'anmf-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;
  loginForm: FormGroup;
  hidePass = true;

  // Observable User Facade property
  user$: Observable<User> = this.userService.user$;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private userService: UserFacade
  ) {}

  ngOnInit() {
    // Login Form Field configuration and validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submitHandler() {
    // Sign in with Email Address
    console.log('submitHandler() > Login with Email attempt');
    const formData = this.loginForm.value;
    this.userService.loginEmail(formData.email, formData.password);
  }

  signInWithGoogle() {
    // Sign in with Google account
    console.log('signInWithGoogle() attempt');
    this.userService.loginGoogle();
  }

  signInWithFacebook() {
    // Sign in with Facebook account
    console.log('signInWithFacebook() attempt');
    // this.userService.loginFacebook();
  }

  signInWithTwitter() {
    // Sign in with Twitter account
    console.log('signInWithTwitter() attempt');
    // this.userService.loginTwitter();
  }

  signInWithGithub() {
    // Sign in with Github account
    console.log('signInWithGithub() attempt');
    // this.userService.loginGithub();
  }

  resetPassword() {
    // Redirect user > account/reset > Password reset for Email Provider
    console.log('resetPassword() > account/reset');
    // *** CAPTURE ANY EXISTING EMAIL ADDRESS BEFORE REDIRECTING USER ***
    // const formEmail = this.loginForm.value.email;
    // this.router.navigate(['account/reset']);
  }

  goRegister(loading?: boolean) {
    const isUserLoading = loading;
    console.log('goRegister() > Check isUserLoading: ' + isUserLoading);
    if (!isUserLoading) {
      console.log('goRegister() > account/register');
      this.router.navigate(['account/register']);
    }
  }
}
