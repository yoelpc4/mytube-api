import { User } from '@prisma/client';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import { ContentService } from '../services';
import { CreateContentDto, GetContentsDto, UpdateContentDto } from '../dto';
import { ContentResource } from '../resources';
import { NotFoundException } from '../../common/exceptions';
import { PaginationResource } from '../../common/resources';

const contentService = new ContentService()

export const getContents = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Please fix the following errors',
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(GetContentsDto, req.query, { excludeExtraneousValues: true })

    try {
        const { contents, count } = await contentService.getContents(req.user as User, dto)

        const data = contents.map(content => instanceToPlain(new ContentResource(content)))

        return res.status(StatusCodes.OK).json(instanceToPlain(new PaginationResource(data, dto.skip, dto.take, count)))
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Get contents failed'
        })
    }
}

export const createContent = async (req: Request, res: Response) => {
    if (!req.files || !req.files.video) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Field video is required',
        })
    }

    const dto = plainToInstance(CreateContentDto, { video: req.files.video }, { excludeExtraneousValues: true })

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

export const findContent = async (req: Request, res: Response) => {
    try {
        const content = await contentService.findContent(+req.params.id)

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
            message: 'Find content failed'
        })
    }
}

export const updateContent = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Please fix the following errors',
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(
        UpdateContentDto,
        {
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags,
            thumbnail: req.files?.thumbnail,
            status: req.body.status,
        },
        { excludeExtraneousValues: true }
    )

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

export const deleteContent = async (req: Request, res: Response) => {
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
