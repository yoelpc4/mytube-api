import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { StatusCodes } from 'http-status-codes'
import { AuthService } from '@/auth/services';
import { UserResource } from '@/auth/resources';
import {
    ForgotPasswordDto,
    LoginDto,
    RegisterDto,
    ResetPasswordDto,
    UpdatePasswordDto,
    UpdateProfileDto
} from '@/auth/dto';
import { UnauthorizedException } from '@/common/exceptions';
import { VALIDATION_ERROR_MESSAGE } from '@/constants';

const authService = new AuthService()

export const register = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: VALIDATION_ERROR_MESSAGE,
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
            message: 'Failed to register account',
        })
    }
}

export const login = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: VALIDATION_ERROR_MESSAGE,
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
            message: 'Failed to log in account',
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
            message: VALIDATION_ERROR_MESSAGE,
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
            message: 'Failed to update profile',
        })
    }
}

export const updatePassword = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: VALIDATION_ERROR_MESSAGE,
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
            message: 'Failed to updating password',
        })
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: VALIDATION_ERROR_MESSAGE,
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(ForgotPasswordDto, req.body, { excludeExtraneousValues: true })

    try {
        const isSent = await authService.forgotPassword(dto)

        if (!isSent) {
            return res.status(StatusCodes.FAILED_DEPENDENCY).json({
                message: 'The email has been rejected by the mail server',
            })
        }

        return res.status(StatusCodes.OK).json({
            message: 'Password reset request email has been sent',
        })
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to send password reset request email',
        })
    }
}

export const resetPassword = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (! errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: VALIDATION_ERROR_MESSAGE,
            errors: errors.array(),
        })
    }

    const dto = plainToInstance(ResetPasswordDto, req.body, { excludeExtraneousValues: true })

    try {
        await authService.resetPassword(dto)

        return res.status(StatusCodes.OK).json({
            message: 'Reset password succeed',
        })
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to reset password',
        })
    }
}
