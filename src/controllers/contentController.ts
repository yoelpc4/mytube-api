import { User } from '@prisma/client'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { validationResult } from 'express-validator'
import { contentService } from '@/services'
import {
    CreateContentDto,
    GetContentsDto,
    GetContentHistoriesDto,
    GetContentFeedsDto,
    UpdateContentDto,
} from '@/dto'
import { ContentResource, ContentViewResource, PaginationResource } from '@/resources'
import { NotFoundException } from '@/exceptions'
import { sendValidationErrorResponse } from '@/helpers';

const getContents = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(GetContentsDto, req.query, {excludeExtraneousValues: true})

    try {
        const {contents, total} = await contentService.getContents(dto, req.user as User)

        const data = contents.map(content => instanceToPlain(new ContentResource(content)))

        return res.status(StatusCodes.OK).json(instanceToPlain(new PaginationResource({
            data,
            total,
            take: dto.take,
            skip: dto.skip,
        })))
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Get content failed'
        })
    }
}

const getContentFeeds = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(GetContentFeedsDto, req.query, {excludeExtraneousValues: true})

    try {
        const {contents, total} = await contentService.getContentFeeds(dto)

        const data = contents.map(content => instanceToPlain(new ContentResource(content)))

        return res.status(StatusCodes.OK).json(instanceToPlain(new PaginationResource({
            data,
            total,
            take: dto.take,
            cursor: dto.cursor,
        })))
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Get content feeds failed'
        })
    }
}

const getContentHistories = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(GetContentHistoriesDto, req.query, {excludeExtraneousValues: true})

    try {
        const {contentViews, total} = await contentService.getContentHistories(dto, req.user as User)

        const data = contentViews.map(contentView => instanceToPlain(new ContentViewResource(contentView)))

        return res.status(StatusCodes.OK).json(instanceToPlain(new PaginationResource({
            data,
            total,
            take: dto.take,
            cursor: dto.cursor,
        })))
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Get content histories failed'
        })
    }
}

const createContent = async (req: Request, res: Response) => {
    if (!req.files || !req.files.video) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Field video is required',
        })
    }

    const dto = plainToInstance(CreateContentDto, {video: req.files.video}, {excludeExtraneousValues: true})

    try {
        const content = await contentService.createContent(dto, req.user as User)

        const contentResource = instanceToPlain(new ContentResource(content))

        return res.status(StatusCodes.CREATED).json(contentResource)
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Create content failed'
        })
    }
}

const findContent = async (req: Request, res: Response) => {
    try {
        const {
            content,
            likesCount,
            dislikesCount,
            relatedContents,
            isLiked,
            isDisliked
        } = await contentService.findContent(+req.params.id, req.user as User)

        const contentResource = instanceToPlain(new ContentResource({
            ...content,
            likesCount,
            dislikesCount,
            relatedContents,
            isLiked,
            isDisliked,
        }))

        return res.status(StatusCodes.OK).json(contentResource)
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Find content failed'
        })
    }
}

const updateContent = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(UpdateContentDto, {
        title: req.body.title,
        description: req.body.description,
        tags: req.body.tags,
        thumbnail: req.files?.thumbnail,
        status: req.body.status,
    }, {excludeExtraneousValues: true})

    try {
        const content = await contentService.updateContent(+req.params.id, dto)

        const contentResource = instanceToPlain(new ContentResource(content))

        return res.status(StatusCodes.OK).json(contentResource)
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Update content failed'
        })
    }
}

const deleteContent = async (req: Request, res: Response) => {
    try {
        await contentService.deleteContent(+req.params.id)

        return res.status(StatusCodes.NO_CONTENT).send()
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Delete content failed'
        })
    }
}

const likeContent = async (req: Request, res: Response) => {
    try {
        await contentService.likeContent(+req.params.id, req.user as User)

        return res.status(StatusCodes.OK).json({
            message: 'Like content succeed',
        })
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Like content failed'
        })
    }
}

const dislikeContent = async (req: Request, res: Response) => {
    try {
        await contentService.dislikeContent(+req.params.id, req.user as User)

        return res.status(StatusCodes.OK).json({
            message: 'Dislike content succeed',
        })
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Dislike content failed'
        })
    }
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
