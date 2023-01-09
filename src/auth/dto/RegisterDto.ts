import { Expose } from 'class-transformer';

export class RegisterDto {
    @Expose()
    name: string

    @Expose()
    email: string

    @Expose()
    password: string
}
