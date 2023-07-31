import { Expose } from 'class-transformer'

export class ForgotPasswordDto {
    @Expose()
    email: string
}
