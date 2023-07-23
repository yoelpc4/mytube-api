import { Expose } from 'class-transformer';

export class ResetPasswordDto {
    @Expose()
    email: string

    @Expose()
    token: string

    @Expose()
    password: string

    @Expose()
    passwordConfirmation: string
}
