import { Prisma, User } from '@prisma/client'
import { Exclude, Expose, Transform } from 'class-transformer'
import { channelService } from '@/services'
import { filesystem } from '@/utils'

export class UserResource {
    id: number

    name?: string

    username?: string

    email?: string

    @Exclude()
    password?: string

    profileBasename?: string | null

    @Expose()
    @Transform(({obj}) => obj.profileBasename ? filesystem.getUrl(channelService.getProfilePath(obj.profileBasename)) : null, {toPlainOnly: true})
    profileUrl?: string | null

    bannerBasename?: string | null

    @Expose()
    @Transform(({obj}) => obj.bannerBasename ? filesystem.getUrl(channelService.getBannerPath(obj.bannerBasename)) : null, {toPlainOnly: true})
    bannerUrl?: string | null

    createdAt?: Date

    updatedAt?: Date

    @Expose()
    @Transform(({value}) => Array.isArray(value) ? value.map((channelSubscription: User) => new UserResource(channelSubscription)) : [], {toPlainOnly: true})
    channelSubscriptions?: UserResource[]

    @Expose()
    @Transform(({value}) => Array.isArray(value) ? value.map((subscriberSubscription: User) => new UserResource(subscriberSubscription)) : [], {toPlainOnly: true})
    subscriberSubscriptions?: UserResource[]

    @Expose()
    @Transform(({obj}) => obj._count?.contents, {toPlainOnly: true})
    contentsCount?: number

    @Expose()
    @Transform(({obj}) => obj._count?.channelSubscriptions, {toPlainOnly: true})
    channelSubscriptionsCount?: number

    @Exclude()
    _count?: Partial<Prisma.UserCountOutputType>

    constructor(data: Partial<UserResource>) {
        Object.assign(this, data)
    }
}
