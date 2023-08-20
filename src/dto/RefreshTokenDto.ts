import { Expose } from 'class-transformer'

export class RefreshTokenDto {
    @Expose()
    token: string
}
