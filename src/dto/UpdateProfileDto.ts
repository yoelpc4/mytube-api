import { Expose } from 'class-transformer'

export class UpdateProfileDto {
    @Expose()
    name: string

    @Expose()
    username: string

    @Expose()
    email: string
}
