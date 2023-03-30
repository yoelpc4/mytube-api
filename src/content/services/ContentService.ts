import { Prisma, User, ContentStatus } from '@prisma/client';
import { rm, stat } from 'fs/promises';
import { cwd } from 'process'
import { extname, join } from 'path';
import pick from 'lodash/pick'
import {
    CreateContentDto,
    GetContentsDto,
    GetContentHistoriesDto,
    GetContentFeedsDto,
    UpdateContentDto
} from '../dto';
import { prisma } from '../../common/services';
import { NotFoundException } from '../../common/exceptions';

interface ContentHistoriesFindManyArgs extends Prisma.ContentViewFindManyArgs {
    select: Prisma.ContentViewSelect & {
        content: Prisma.ContentArgs,
    },
}

export class ContentService {
    async getContents(dto: GetContentsDto, user: User) {
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
            prisma.content.findMany(findManyArgs),
            prisma.content.count(pick(findManyArgs, ['where'])),
        ])

        return {
            contents,
            total,
        }
    }

    async getContentFeeds(dto: GetContentFeedsDto) {
        const findManyArgs: Prisma.ContentFindManyArgs = {
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
            prisma.content.findMany(findManyArgs),
            prisma.content.count(pick(findManyArgs, ['where'])),
        ])

        return {
            contents,
            total,
        }
    }

    async getContentHistories(dto: GetContentHistoriesDto, user: User) {
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
            distinct: ['contentId'],
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
            prisma.contentView.findMany(findManyArgs),
            prisma.contentView.count(pick(findManyArgs, ['where'])),
        ])

        return {
            contents: contentViews.map(contentView => contentView.content),
            total,
        }
    }

    async createContent(dto: CreateContentDto, user: User) {
        const videoFilename = `${Date.now()}${Math.round(Math.random() * 1E9)}`

        const videoBasename = `${videoFilename}${extname(dto.video.name)}`

        return await prisma.$transaction(async tx => {
            const content = await tx.content.create({
                data: {
                    title: dto.video.name,
                    videoBasename,
                    createdById: user.id,
                },
            })

            await dto.video.mv(this.getVideoPath(videoBasename))

            return content
        })
    }

    async findContent(id: number, user?: User) {
        const content = await prisma.content.findUnique({
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
                id,
            },
        })

        if (!content) {
            throw new NotFoundException(`Content with id ${id} is not found`)
        }

        await prisma.contentView.create({
            data: {
                contentId: id,
                userId: user?.id,
            },
        })

        ++content._count.contentViews

        const [countLikes, countDislikes, relatedContents, contentLike, contentDislike] = await Promise.all([
            prisma.contentLike.count({
                where: {
                    contentId: id,
                    isLike: true,
                },
            }),
            prisma.contentLike.count({
                where: {
                    contentId: id,
                    isLike: false,
                },
            }),
            prisma.content.findMany({
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
            prisma.contentLike.findFirst({
                select: {
                    id: true,
                },
                where: {
                    contentId: id,
                    userId: user?.id,
                    isLike: true,
                },
            }),
            prisma.contentLike.findFirst({
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

    async updateContent(id: number, dto: UpdateContentDto) {
        const content = await prisma.content.findUnique({
            select: {
                id: true,
                thumbnailBasename: true,
            },
            where: {
                id,
            },
        })

        if (!content) {
            throw new NotFoundException(`Content with id ${id} is not found`)
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

        return await prisma.$transaction(async tx => {
            const updatedContent = await tx.content.update({
                where: {
                    id: content.id,
                },
                data,
            })

            if (thumbnailBasename && dto.thumbnail) {
                if (content.thumbnailBasename) {
                    const thumbnailPath = this.getThumbnailPath(content.thumbnailBasename)

                    const thumbnailStats = await stat(thumbnailPath)

                    if (thumbnailStats.isFile()) {
                        await rm(thumbnailPath)
                    }
                }

                await dto.thumbnail.mv(this.getThumbnailPath(thumbnailBasename))
            }

            return updatedContent
        })
    }

    async deleteContent(id: number) {
        const content = await prisma.content.findUnique({
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
            throw new NotFoundException(`Content with id ${id} is not found`)
        }

        await prisma.$transaction(async tx => {
            await tx.content.delete({
                where: {
                    id: content.id,
                },
            })

            const videoPath = this.getVideoPath(content.videoBasename)

            const videoStats = await stat(videoPath)

            if (videoStats.isFile()) {
                await rm(videoPath)
            }

            if (content.thumbnailBasename) {
                const thumbnailPath = this.getThumbnailPath(content.thumbnailBasename)

                const thumbnailStats = await stat(thumbnailPath)

                if (thumbnailStats.isFile()) {
                    await rm(thumbnailPath)
                }
            }
        })
    }

    async likeContent(id: number, user: User) {
        const content = await prisma.content.findUnique({
            select: {
                id: true,
            },
            where: {
                id,
            },
        })

        if (!content) {
            throw new NotFoundException(`Content with id ${id} is not found`)
        }

        const contentLike = await prisma.contentLike.findFirst({
            select: {
                id: true,
                isLike: true,
            },
            where: {
                contentId: id,
                userId: user.id,
            },
        })

        await prisma.$transaction(async tx => {
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

    async dislikeContent(id: number, user: User) {
        const content = await prisma.content.findUnique({
            select: {
                id: true,
            },
            where: {
                id,
            },
        })

        if (!content) {
            throw new NotFoundException(`Content with id ${id} is not found`)
        }

        const contentLike = await prisma.contentLike.findFirst({
            select: {
                id: true,
                isLike: true,
            },
            where: {
                contentId: id,
                userId: user.id,
            },
        })

        await prisma.$transaction(async tx => {
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

    private getVideoPath(basename: string) {
        return join(cwd(), 'public', 'videos', basename)
    }

    private getThumbnailPath(basename: string) {
        return join(cwd(), 'public', 'thumbnails', basename)
    }
}
