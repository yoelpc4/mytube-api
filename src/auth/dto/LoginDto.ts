import { Expose } from 'class-transformer';

export class LoginDto {
    @Expose()
    email: string

    @Expose()
    password: string
}
