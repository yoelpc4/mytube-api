import { User } from '@prisma/client';
import { db } from '@/utils';

const getDashboard = async (user: User) => {
    const [
        subscribersCount,
        contentsCount,
        contentViewsCount,
        contentLikesCount,
        latestContent,
        recentSubscriptions,
    ] = await Promise.all([
        db.client.subscription.count({
            where: {
                channelId: user.id,
            },
        }),
        db.client.content.count({
            where: {
                createdById: user.id,
            },
        }),
        db.client.contentView.count({
            where: {
                content: {
                    is: {
                        createdById: user.id,
                    },
                },
            },
        }),
        db.client.contentLike.count({
            where: {
                isLike: true,
                content: {
                    is: {
                        createdById: user.id,
                    },
                },
            },
        }),
        db.client.content.findFirst({
            include: {
                _count: {
                    select: {
                        contentViews: true,
                        contentLikes: {
                            where: {
                                isLike: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        }),
        db.client.subscription.findMany({
            include: {
                subscriber: {
                    include: {
                        _count: {
                            select: {
                                channelSubscriptions: true,
                            },
                        },
                    }
                },
            },
            where: {
              channelId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
        }),
    ])

    return {
        contentsCount,
        subscribersCount,
        contentViewsCount,
        contentLikesCount,
        latestContent,
        recentSubscriptions,
    }
}

export {
    getDashboard,
}
