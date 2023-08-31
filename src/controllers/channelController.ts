import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { validationResult } from 'express-validator'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { channelService } from '@/services'
import { GetChannelContentsDto, UpdateChannelDto } from '@/dto'
import {
    AlreadySubscribedToChannelException,
    NeverSubscribedToChannelException,
    NotFoundException,
    SubscribeToOwnChannelException,
    UnsubscribeToOwnChannelException
} from '@/exceptions'
import { ContentResource, PaginationResource, UserResource } from '@/resources'
import { sendValidationErrorResponse } from '@/helpers';

const findChannel = async (req: Request, res: Response) => {
    try {
        const channel = await channelService.findChannel(req.params.username, req.user as User)

        const channelResource = instanceToPlain(new UserResource(channel))

        return res.status(StatusCodes.OK).json(channelResource)
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Find channel failed'
        })
    }
}

const getChannelContents = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(GetChannelContentsDto, req.query, {excludeExtraneousValues: true})

    try {
        const {contents, total} = await channelService.getChannelContents(+req.params.createdById, dto)

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
            message: 'Get channel content failed'
        })
    }
}

const subscribe = async (req: Request, res: Response) => {
    try {
        await channelService.subscribe(+req.params.id, req.user as User)

        return res.status(StatusCodes.OK).json({
            message: 'Subscribe succeed',
        })
    } catch (error) {
        console.log(error)

        if (error instanceof SubscribeToOwnChannelException || error instanceof AlreadySubscribedToChannelException) {
            return sendValidationErrorResponse(res, [
                {
                    value: error.channelId,
                    msg: error.message,
                    param: 'id',
                    location: 'params',
                },
            ])
        }

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Subscribe failed'
        })
    }
}

const unsubscribe = async (req: Request, res: Response) => {
    try {
        await channelService.unsubscribe(+req.params.id, req.user as User)

        return res.status(StatusCodes.OK).json({
            message: 'Unsubscribe succeed',
        })
    } catch (error) {
        console.log(error)

        if (error instanceof UnsubscribeToOwnChannelException || error instanceof NeverSubscribedToChannelException) {
            return sendValidationErrorResponse(res, [
                {
                    value: error.channelId,
                    msg: error.message,
                    param: 'id',
                    location: 'params',
                },
            ])
        }

        if (error instanceof NotFoundException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Unsubscribe failed'
        })
    }
}

const updateChannel = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(UpdateChannelDto, {
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        profile: req.files?.profile,
        banner: req.files?.banner,
    }, {excludeExtraneousValues: true})

    try {
        const user = await channelService.updateChannel(dto, req.user as User)

        const userResource = instanceToPlain(new UserResource(user))

        return res.status(StatusCodes.OK).json(userResource)
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update channel',
        })
    }
}

export {
    findChannel,
    getChannelContents,
    subscribe,
    unsubscribe,
    updateChannel,
}
