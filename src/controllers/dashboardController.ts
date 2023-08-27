import { User } from '@prisma/client';
import { instanceToPlain } from 'class-transformer';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { dashboardService } from '@/services'
import { ContentResource, UserResource } from '@/resources';

const getDashboard = async (req: Request, res: Response) => {
    try {
        const {
            latestContent,
            recentSubscriptions,
            ...metrics
        } = await dashboardService.getDashboard(req.user as User)

        const latestContentResource = latestContent ? instanceToPlain(new ContentResource({
            ...latestContent,
            likesCount: latestContent._count.contentLikes,
        })) : null

        const recentSubscriberResources = recentSubscriptions.map(recentSubscription => instanceToPlain(new UserResource(recentSubscription.subscriber)))

        return res.status(StatusCodes.OK).json({
            ...metrics,
            latestContent: latestContentResource,
            recentSubscribers: recentSubscriberResources,
        })
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to get dashboard',
        })
    }
}

export {
    getDashboard,
}
