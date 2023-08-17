import { ContentStatus, Prisma, User } from '@prisma/client'
import { rm, stat } from 'fs/promises'
import { cwd } from 'process'
import { extname, join } from 'path'
import pick from 'lodash/pick'
import {
    CreateContentDto,
    GetContentFeedsDto,
    GetContentHistoriesDto,
    GetContentsDto,
    UpdateContentDto,
} from '@/dto'
import { NotFoundException } from '@/exceptions'
import { db } from '@/utils'

interface ContentHistoriesFindManyArgs extends Prisma.ContentViewFindManyArgs {
    select: Prisma.ContentViewSelect & {
        content: Prisma.ContentArgs,
    },
}

const getVideoPath = (basename: string) => join(cwd(), 'public', 'videos', basename)

const getThumbnailPath = (basename: string) => join(cwd(), 'public', 'thumbnails', basename)

const getContents = async (dto: GetContentsDto, user: User) => {
    const findManyArgs: Prisma.ContentFindManyArgs = {
        where: {
            createdById: user.id,
        },
        skip: dto.skip,
        take: dto.take,
    }

    if (dto.sort) {
        findManyArgs.orderBy = {
            ...findManyArgs.orderBy,
            [dto.sort.field]: dto.sort.order
        }
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

const getContentFeeds = async (dto: GetContentFeedsDto) => {
    const findManyArgs: Prisma.ContentFindManyArgs = {
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                },
            },
            _count: {
                select: {
                    contentViews: true,
                },
            },
        },
        where: {
            status: ContentStatus.PUBLISHED,
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

const getContentHistories = async (dto: GetContentHistoriesDto, user: User) => {
    const findManyArgs: ContentHistoriesFindManyArgs = {
        select: {
            id: true,
            contentId: true,
            content: {
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            contentViews: true,
                        },
                    },
                },
            },
        },
        where: {
            userId: user.id,
            content: {
                status: ContentStatus.PUBLISHED,
            },
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

    const [contentViews, total] = await Promise.all([
        db.client.contentView.findMany(findManyArgs),
        db.client.contentView.count(pick(findManyArgs, ['where'])),
    ])

    return {
        contentViews,
        total,
    }
}

const createContent = async (dto: CreateContentDto, user: User) => {
    const videoFilename = `${Date.now()}${Math.round(Math.random() * 1E9)}`

    const videoBasename = `${videoFilename}${extname(dto.video.name)}`

    return await db.client.$transaction(async tx => {
        const content = await tx.content.create({
            data: {
                title: dto.video.name,
                videoBasename,
                createdById: user.id,
            },
        })

        await dto.video.mv(getVideoPath(videoBasename))

        return content
    })
}

const findContent = async (id: number, user?: User) => {
    const content = await db.client.content.findUnique({
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    username: true,
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
                            channelSubscriptions: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    contentViews: true,
                },
            },
        },
        where: {
            id,
        },
    })

    if (!content) {
        throw new NotFoundException('Content does not exists')
    }

    await db.client.contentView.create({
        data: {
            contentId: id,
            userId: user?.id,
        },
    })

    ++content._count.contentViews

    const [countLikes, countDislikes, relatedContents, contentLike, contentDislike] = await Promise.all([
        db.client.contentLike.count({
            where: {
                contentId: id,
                isLike: true,
            },
        }),
        db.client.contentLike.count({
            where: {
                contentId: id,
                isLike: false,
            },
        }),
        db.client.content.findMany({
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        contentViews: true,
                    },
                },
            },
            where: {
                id: {
                    not: id,
                },
                status: ContentStatus.PUBLISHED,
                OR: [
                    {
                        title: {
                            search: `'${content.title}'`,
                        },
                    },
                    {
                        description: {
                            search: `'${content.title}'`,
                        },
                    },
                    {
                        tags: {
                            search: `'${content.title}'`,
                        },
                    },
                ],
            },
            take: 10,
        }),
        db.client.contentLike.findFirst({
            select: {
                id: true,
            },
            where: {
                contentId: id,
                userId: user?.id,
                isLike: true,
            },
        }),
        db.client.contentLike.findFirst({
            select: {
                id: true,
            },
            where: {
                contentId: id,
                userId: user?.id,
                isLike: false,
            },
        }),
    ])

    return {
        content,
        countLikes,
        countDislikes,
        relatedContents,
        isLiked: !!contentLike,
        isDisliked: !!contentDislike,
    }
}

const updateContent = async (id: number, dto: UpdateContentDto) => {
    const content = await db.client.content.findUnique({
        select: {
            id: true,
            thumbnailBasename: true,
        },
        where: {
            id,
        },
    })

    if (!content) {
        throw new NotFoundException('Content does not exists')
    }

    const data: Prisma.ContentUncheckedUpdateInput = {
        title: dto.title,
        description: dto.description,
        tags: dto.tags,
        status: dto.status,
    }

    let thumbnailBasename: string

    if (dto.thumbnail) {
        const thumbnailFilename = `${Date.now()}${Math.round(Math.random() * 1E9)}`

        thumbnailBasename = `${thumbnailFilename}${extname(dto.thumbnail.name)}`

        data.thumbnailBasename = thumbnailBasename
    }

    return await db.client.$transaction(async tx => {
        const updatedContent = await tx.content.update({
            where: {
                id: content.id,
            },
            data,
        })

        if (thumbnailBasename && dto.thumbnail) {
            if (content.thumbnailBasename) {
                const thumbnailPath = getThumbnailPath(content.thumbnailBasename)

                const thumbnailStats = await stat(thumbnailPath)

                if (thumbnailStats.isFile()) {
                    await rm(thumbnailPath)
                }
            }

            await dto.thumbnail.mv(getThumbnailPath(thumbnailBasename))
        }

        return updatedContent
    })
}

const deleteContent = async (id: number) => {
    const content = await db.client.content.findUnique({
        select: {
            id: true,
            videoBasename: true,
            thumbnailBasename: true,
        },
        where: {
            id,
        },
    })

    if (!content) {
        throw new NotFoundException('Content does not exists')
    }

    await db.client.$transaction(async tx => {
        await tx.content.delete({
            where: {
                id: content.id,
            },
        })

        const videoPath = getVideoPath(content.videoBasename)

        const videoStats = await stat(videoPath)

        if (videoStats.isFile()) {
            await rm(videoPath)
        }

        if (content.thumbnailBasename) {
            const thumbnailPath = getThumbnailPath(content.thumbnailBasename)

            const thumbnailStats = await stat(thumbnailPath)

            if (thumbnailStats.isFile()) {
                await rm(thumbnailPath)
            }
        }
    })
}

const likeContent = async (id: number, user: User) => {
    const content = await db.client.content.findUnique({
        select: {
            id: true,
        },
        where: {
            id,
        },
    })

    if (!content) {
        throw new NotFoundException('Content does not exists')
    }

    const contentLike = await db.client.contentLike.findFirst({
        select: {
            id: true,
            isLike: true,
        },
        where: {
            contentId: id,
            userId: user.id,
        },
    })

    await db.client.$transaction(async tx => {
        if (contentLike) {
            await tx.contentLike.delete({
                where: {
                    id: contentLike.id,
                },
            })
        }

        if (!contentLike || !contentLike.isLike) {
            await tx.contentLike.create({
                data: {
                    contentId: id,
                    userId: user.id,
                    isLike: true,
                },
            })
        }
    })
}

const dislikeContent = async (id: number, user: User) => {
    const content = await db.client.content.findUnique({
        select: {
            id: true,
        },
        where: {
            id,
        },
    })

    if (!content) {
        throw new NotFoundException('Content does not exists')
    }

    const contentLike = await db.client.contentLike.findFirst({
        select: {
            id: true,
            isLike: true,
        },
        where: {
            contentId: id,
            userId: user.id,
        },
    })

    await db.client.$transaction(async tx => {
        if (contentLike) {
            await tx.contentLike.delete({
                where: {
                    id: contentLike.id,
                },
            })
        }

        if (!contentLike || contentLike.isLike) {
            await tx.contentLike.create({
                data: {
                    contentId: id,
                    userId: user.id,
                    isLike: false,
                },
            })
        }
    })
}

export {
    getContents,
    getContentFeeds,
    getContentHistories,
    createContent,
    findContent,
    updateContent,
    deleteContent,
    likeContent,
    dislikeContent,
}
