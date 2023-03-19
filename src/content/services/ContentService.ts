import { Prisma, User, ContentStatus } from '@prisma/client';
import { rm, stat } from 'fs/promises';
import { cwd } from 'process'
import { extname, join } from 'path';
import pick from 'lodash/pick'
import { CreateContentDto, GetContentsDto, GetPublishedContentsDto, UpdateContentDto } from '../dto';
import { prisma } from '../../common/services';
import { NotFoundException } from '../../common/exceptions';

interface FindContentOptions {
    mustIncrementViews: boolean
    includeViewCounts: boolean
    user: User
}

export class ContentService {
    async getContents(dto: GetContentsDto, user: User) {
        const findManyArgs: Prisma.ContentFindManyArgs = {
            where: {
                createdById: user.id,
            },
            skip: +(dto.skip ?? 0),
            take: +(dto.take ?? 10),
        }

        if (dto.sort) {
            findManyArgs.orderBy = {
                ...findManyArgs.orderBy,
                [dto.sort.field]: dto.sort.order
            }
        }

        const contents = await prisma.content.findMany(findManyArgs)

        const total = await prisma.content.count(pick(findManyArgs, ['where']))

        return {
            contents,
            total,
        }
    }

    async getPublishedContents(dto: GetPublishedContentsDto) {
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
            take: +(dto.take ?? 10),
        }

        if (dto.cursor) {
            findManyArgs.cursor = {
                id: dto.cursor,
            }

            findManyArgs.skip = 1
        }

        if (dto.sort) {
            findManyArgs.orderBy = {
                ...findManyArgs.orderBy,
                [dto.sort.field]: dto.sort.order
            }
        }

        const contents = await prisma.content.findMany(findManyArgs)

        const total = await prisma.content.count(pick(findManyArgs, ['where']))

        return {
            contents,
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

    async findContent(id: number, findContentOptions?: Partial<FindContentOptions>) {
        const findUniqueArgs: Prisma.ContentFindUniqueArgs = {
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            where: {
                id,
            },
        }

        if (findContentOptions?.includeViewCounts) {
            findUniqueArgs.include = {
                ...findUniqueArgs.include,
                _count: {
                    select: {
                        contentViews: true,
                    },
                },
            }
        }

        const content = await prisma.content.findUnique(findUniqueArgs)

        if (!content) {
          throw new NotFoundException(`Content with id ${id} is not found`)
        }

        if (findContentOptions?.mustIncrementViews) {
            await prisma.contentView.create({
                data: {
                    contentId: content.id,
                    userId: findContentOptions?.user?.id,
                },
            })
        }

        return content
    }

    async updateContent(id: number, dto: UpdateContentDto) {
        const content = await this.findContent(id)

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
        const content = await this.findContent(id)

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

    getVideoPath(basename: string) {
        return join(cwd(), 'public', 'videos', basename)
    }

    getThumbnailPath(basename: string) {
        return join(cwd(), 'public', 'thumbnails', basename)
    }
}