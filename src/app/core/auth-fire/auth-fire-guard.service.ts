import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

import { UserFacade } from './auth-fire.facade';

@Injectable()
export class AuthFireGuardService implements CanActivate {
  constructor(private userService: UserFacade, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.userService.user$.pipe(
      take(1),
      map(user => !!user.uid),
      tap(loggedIn => {
        if (!loggedIn) {
          console.log('access denied');
          console.log('You must be logged in!', 'error');
          this.router.navigate(['account/login']);
        }
      })
    );
  }
}
