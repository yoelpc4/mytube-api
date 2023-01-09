import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { AuthService } from '../services';
import { UnauthorizedException } from '../../common/exceptions';
import { UserResource } from '../resources';
import { LoginDto, RegisterDto } from '../dto';

const authService = new AuthService()

export const register = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Please fix the following errors',
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(RegisterDto, req.body, { excludeExtraneousValues: true })

    try {
        const accessToken = await authService.register(dto)

        return res.status(StatusCodes.CREATED).json({
            accessToken,
        })
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to registering your account',
        })
    }
}

export const login = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Please fix the following errors',
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(LoginDto, req.body, { excludeExtraneousValues: true })

    try {
        const accessToken = await authService.login(dto)

        return res.status(StatusCodes.OK).json({
            accessToken,
        })
    } catch (error) {
        console.log(error)

        if (error instanceof UnauthorizedException) {
            return res.status(error.code).json({
                message: error.message,
            })
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to logging in your account',
        })
    }
}

export const getUser = (req: Request, res: Response) => res.json(instanceToPlain(new UserResource(req.user as User)))
