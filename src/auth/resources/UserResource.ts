import { Prisma } from '@prisma/client';
import { Exclude, Expose, Transform } from 'class-transformer';

export class UserResource {
    id: number

    name?: string

    username?: string

    email?: string

    @Exclude()
    password?: string

    createdAt?: Date

    updatedAt?: Date

    @Expose()
    @Transform(({ obj }) => obj._count?.contents, { toPlainOnly: true })
    countContents?: number

    @Expose()
    @Transform(({ obj }) => obj._count?.subscribers, { toPlainOnly: true })
    countSubscribers?: number

    @Exclude()
    _count?: Partial<Prisma.UserCountOutputType>

    constructor(data: Partial<UserResource>) {
        Object.assign(this, data)
    }
}
