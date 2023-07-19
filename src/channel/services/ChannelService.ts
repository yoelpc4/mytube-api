import { ContentStatus, Prisma, User } from '@prisma/client';
import pick from 'lodash/pick';
import { GetChannelContentsDto } from '@/channel/dto';
import { prisma } from '@/common/services';
import { NotFoundException } from '@/common/exceptions';
import {
    SubscribeToOwnedChannelException,
    UnsubscribeToOwnedChannelException,
} from '../exceptions';

export class ChannelService {
    async findChannel(username: string, user?: User) {
        const channel = await prisma.user.findUnique({
            include: {
                channelSubscriptions: {
                    select: {
                        id: true,
                        channelId: true,
                        subscriberId: true,
                    },
                    where: {
                        subscriberId: user?.id,
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

    async getChannelContents(createdById: number, dto: GetChannelContentsDto) {
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
            prisma.content.findMany(findManyArgs),
            prisma.content.count(pick(findManyArgs, ['where'])),
        ])

        return {
            contents,
            total,
        }
    }

    async subscribe(channelId: number, user: User) {
        if (channelId === user.id) {
            throw new SubscribeToOwnedChannelException()
        }

        const channel = await prisma.user.findUnique({
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

        const subscription = await prisma.subscription.findFirst({
            select: {
                id: true,
            },
            where: {
                channelId,
                subscriberId: user.id,
            },
        })

        if (subscription) {
            return false
        }

        await prisma.subscription.create({
            data: {
                channelId,
                subscriberId: user.id,
            },
        })

        return true
    }

    async unsubscribe(channelId: number, user: User) {
        if (channelId === user.id) {
            throw new UnsubscribeToOwnedChannelException()
        }

        const channel = await prisma.user.findUnique({
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

        const subscription = await prisma.subscription.findFirst({
            select: {
                id: true,
            },
            where: {
                channelId,
                subscriberId: user.id,
            },
        })

        if (!subscription) {
            return false
        }

        await prisma.subscription.delete({
            where: {
                id: subscription.id,
            },
        })

        return true
    }
}
