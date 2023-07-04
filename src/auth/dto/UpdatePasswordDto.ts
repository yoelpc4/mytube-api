import { Expose } from 'class-transformer';

export class UpdatePasswordDto {
    @Expose()
    currentPassword: string

    @Expose()
    password: string

    @Expose()
    passwordConfirmation: string
}
