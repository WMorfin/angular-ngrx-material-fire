export class User {
  constructor(
    public uid: string,
    public email: string,
    public displayName: string,
    public photoUrl: string,
    public phoneNumber: string,
    public providerId: string,
    public verified: boolean,
    public loading?: boolean
  ) {}
}
