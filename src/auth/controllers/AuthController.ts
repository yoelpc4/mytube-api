import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { AuthService } from '../services';
import { UnauthorizedException } from '../../common/exceptions';
import { UserResource } from '../resources';
import { LoginDto, RegisterDto, UpdatePasswordDto, UpdateProfileDto } from '../dto';

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

export const getUser = (req: Request, res: Response) => {
    const userResource = instanceToPlain(new UserResource(req.user as User))

    return res.json(userResource)
}

export const updateProfile = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Please fix the following errors',
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(UpdateProfileDto, req.body, { excludeExtraneousValues: true })

    try {
        const user = await authService.updateProfile(dto, req.user as User)

        const userResource = instanceToPlain(new UserResource(user))

        return res.json(userResource)
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to updating your profile',
        })
    }
}

export const updatePassword = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Please fix the following errors',
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(UpdatePasswordDto, req.body, { excludeExtraneousValues: true })

    try {
        await authService.updatePassword(dto, req.user as User)

        return res.json({
            message: 'Update password succeed',
        })
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to updating your password',
        })
    }
}
