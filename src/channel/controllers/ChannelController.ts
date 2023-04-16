import { User } from '@prisma/client';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { GetChannelContentsDto } from '../dto';
import { ChannelService } from '../services/ChannelService';
import { SubscribeToOwnedChannelException, UnsubscribeToOwnedChannelException } from '../exceptions';
import { NotFoundException } from '../../common/exceptions';
import { PaginationResource } from '../../common/resources';
import { ContentResource } from '../../content/resources';
import { UserResource } from '../../auth/resources';

const channelService = new ChannelService()

export const findChannel = async (req: Request, res: Response) => {
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

export const getChannelContents = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Please fix the following errors',
            errors: errors.array(),
        })
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
            message: 'Get channel contents failed'
        })
    }
}

export const subscribe = async (req: Request, res: Response) => {
    try {
        const isSubscribed = await channelService.subscribe(+req.params.id, req.user as User)

        return res.status(StatusCodes.OK).json({
            message: isSubscribed ? 'Subscribe succeed' : 'Unable to subscribe, the user is already subscribed to the channel',
            result: isSubscribed,
        })
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException || error instanceof SubscribeToOwnedChannelException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Subscribe failed'
        })
    }
}

export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const isUnsubscribed = await channelService.unsubscribe(+req.params.id, req.user as User)

        return res.status(StatusCodes.OK).json({
            message: isUnsubscribed ? 'Unsubscribe succeed' : 'Unable to unsubscribe, the user was not subscribed to the channel',
            result: isUnsubscribed,
        })
    } catch (error) {
        console.log(error)

        if (error instanceof NotFoundException || error instanceof UnsubscribeToOwnedChannelException) {
            return res.status(error.code).json({
                message: error.message
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Unsubscribe failed'
        })
    }
}
