import { User } from '@prisma/client'
import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { StatusCodes } from 'http-status-codes'
import { authService } from '@/services'
import { UserResource } from '@/resources'
import {
    ForgotPasswordDto,
    LoginDto,
    RegisterDto,
    ResetPasswordDto,
    UpdatePasswordDto,
    UpdateProfileDto
} from '@/dto'
import { UnauthorizedException } from '@/exceptions'
import { sendValidationErrorResponse } from '@/helpers';

async function register(req: Request, res: Response) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
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

async function login(req: Request, res: Response) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
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

function getUser(req: Request, res: Response) {
    const userResource = instanceToPlain(new UserResource(req.user as User))

    return res.json(userResource)
}

async function updateProfile(req: Request, res: Response) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
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

async function updatePassword(req: Request, res: Response) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
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

async function forgotPassword(req: Request, res: Response) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
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

async function resetPassword(req: Request, res: Response) {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
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

export {
    register,
    login,
    getUser,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
}
