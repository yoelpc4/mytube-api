import { ContentStatus, Prisma, User } from '@prisma/client'
import pick from 'lodash/pick'
import { GetChannelContentsDto, UpdateChannelDto } from '@/dto'
import {
    AlreadySubscribedToChannelException,
    NeverSubscribedToChannelException,
    NotFoundException,
    SubscribeToOwnChannelException,
    UnsubscribeToOwnChannelException,
} from '@/exceptions'
import { db, filesystem } from '@/utils'
import { join } from 'path'

const getProfilePath = (basename = '') => join('channel', 'profile', basename)

const getBannerPath = (basename = '') => join('channel', 'banner', basename)

const findChannel = async (username: string, user?: User) => {
    const channel = await db.client.user.findUnique({
        include: {
            ...user && {
                channelSubscriptions: {
                    select: {
                        id: true,
                        channelId: true,
                        subscriberId: true,
                    },
                    where: {
                        subscriberId: user.id,
                    },
                },
            },
            _count: {
                select: {
                    contents: true,
                    channelSubscriptions: true,
                },
            }
        },
        where: {
            username,
        },
    })

    if (!channel) {
        throw new NotFoundException('Channel does not exists')
    }

    return channel
}

const getChannelContents = async (createdById: number, dto: GetChannelContentsDto) => {
    const findManyArgs: Prisma.ContentFindManyArgs = {
        include: {
            _count: {
                select: {
                    contentViews: true,
                },
            },
        },
        where: {
            status: ContentStatus.PUBLISHED,
            createdById,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: dto.take,
    }

    if (dto.cursor) {
        findManyArgs.cursor = {
            id: dto.cursor,
        }

        findManyArgs.skip = 1
    }

    const [contents, total] = await Promise.all([
        db.client.content.findMany(findManyArgs),
        db.client.content.count(pick(findManyArgs, ['where'])),
    ])

    return {
        contents,
        total,
    }
}

const subscribe = async (channelId: number, user: User) => {
    if (channelId === user.id) {
        throw new SubscribeToOwnChannelException(channelId)
    }

    const channel = await db.client.user.findUnique({
        select: {
            id: true,
        },
        where: {
            id: channelId,
        },
    })

    if (!channel) {
        throw new NotFoundException('Channel does not exists')
    }

    const subscription = await db.client.subscription.findFirst({
        select: {
            id: true,
        },
        where: {
            channelId,
            subscriberId: user.id,
        },
    })

    if (subscription) {
        throw new AlreadySubscribedToChannelException(channelId)
    }

    await db.client.subscription.create({
        data: {
            channelId,
            subscriberId: user.id,
        },
    })
}

const unsubscribe = async (channelId: number, user: User) => {
    if (channelId === user.id) {
        throw new UnsubscribeToOwnChannelException(channelId)
    }

    const channel = await db.client.user.findUnique({
        select: {
            id: true,
        },
        where: {
            id: channelId,
        },
    })

    if (!channel) {
        throw new NotFoundException('Channel does not exists')
    }

    const subscription = await db.client.subscription.findFirst({
        select: {
            id: true,
        },
        where: {
            channelId,
            subscriberId: user.id,
        },
    })

    if (!subscription) {
        throw new NeverSubscribedToChannelException(channelId)
    }

    await db.client.subscription.delete({
        where: {
            id: subscription.id,
        },
    })
}

const updateChannel = async (dto: UpdateChannelDto, user: User) => {
    const data: Prisma.UserUncheckedUpdateInput = {
        name: dto.name,
        username: dto.username,
        email: dto.email,
    }

    if (dto.profile) {
        data.profileBasename = await filesystem.save(dto.profile, getProfilePath())
    }

    if (dto.banner) {
        data.bannerBasename = await filesystem.save(dto.banner, getBannerPath())
    }

    const updatedUser = await db.client.user.update({
        data,
        where: {
            id: user.id,
        },
    })

    if (dto.profile && user.profileBasename) {
        await filesystem.remove(getProfilePath(user.profileBasename))
    }

    if (dto.banner && user.bannerBasename) {
        await filesystem.remove(getBannerPath(user.bannerBasename))
    }

    return updatedUser
}

export {
    getProfilePath,
    getBannerPath,
    findChannel,
    getChannelContents,
    subscribe,
    unsubscribe,
    updateChannel,
}
