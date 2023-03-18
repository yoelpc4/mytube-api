import { Exclude } from 'class-transformer';

export class UserResource {
    id: number

    name?: string

    email?: string

    @Exclude()
    password?: string

    createdAt?: Date

    updatedAt?: Date

    constructor(data: Partial<UserResource>) {
        Object.assign(this, data)
    }
}
