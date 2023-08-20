import { User } from '@prisma/client'
import { CookieOptions, Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { StatusCodes } from 'http-status-codes'
import { DateTime } from 'luxon';
import { authService } from '@/services'
import { UserResource } from '@/resources'
import {
    ForgotPasswordDto,
    LoginDto,
    RefreshTokenDto,
    RegisterDto,
    ResetPasswordDto,
    UpdatePasswordDto,
    UpdateProfileDto
} from '@/dto'
import { UnauthorizedException } from '@/exceptions'
import { sendValidationErrorResponse } from '@/helpers';

const accessTokenCookieName = process.env.JWT_ACCESS_TOKEN_COOKIE_NAME

if (!accessTokenCookieName) {
    throw new Error('Undefined JWT access token cookie name')
}

const refreshTokenCookieName = process.env.JWT_REFRESH_TOKEN_COOKIE_NAME

if (!refreshTokenCookieName) {
    throw new Error('Undefined JWT refresh token cookie name')
}

const jwtCookieDomain = process.env.JWT_COOKIE_DOMAIN

if (!jwtCookieDomain) {
    throw new Error('Undefined JWT cookie domain')
}

const getAccessTokenCookieOptions = (): CookieOptions => ({
    domain: jwtCookieDomain,
    secure: process.env.JWT_COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax',
    expires: DateTime.now().plus({minutes: 15}).toJSDate(),
})

const getRefreshTokenCookieOptions = (): CookieOptions => ({
    domain: jwtCookieDomain,
    secure: process.env.JWT_COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax',
    expires: DateTime.now().plus({day: 1}).toJSDate(),
})

const register = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(RegisterDto, req.body, {excludeExtraneousValues: true})

    try {
        const {accessToken, refreshToken, user} = await authService.register(dto)

        const userResource = instanceToPlain(new UserResource(user))

        return res
            .status(StatusCodes.CREATED)
            .cookie(accessTokenCookieName, accessToken, getAccessTokenCookieOptions())
            .cookie(refreshTokenCookieName, refreshToken, getRefreshTokenCookieOptions())
            .json(userResource)
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to register account',
        })
    }
}

const login = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(LoginDto, req.body, {excludeExtraneousValues: true})

    try {
        const {accessToken, refreshToken, user} = await authService.login(dto)

        const userResource = instanceToPlain(new UserResource(user))

        return res
            .status(StatusCodes.OK)
            .cookie(accessTokenCookieName, accessToken, getAccessTokenCookieOptions())
            .cookie(refreshTokenCookieName, refreshToken, getRefreshTokenCookieOptions())
            .json(userResource)
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

const refresh = async (req: Request, res: Response) => {
    const dto = plainToInstance(
        RefreshTokenDto,
        {token: req.cookies[refreshTokenCookieName]},
        {excludeExtraneousValues: true}
    )

    try {
        const accessToken = await authService.refresh(dto)

        return res
            .status(StatusCodes.OK)
            .cookie(accessTokenCookieName, accessToken, getAccessTokenCookieOptions())
            .json({
                message: 'Refresh token succeed',
            })
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: 'Unauthenticated',
        })
    }
}

const forgotPassword = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(ForgotPasswordDto, req.body, {excludeExtraneousValues: true})

    try {
        const isSent = await authService.forgotPassword(dto)

        if (!isSent) {
            return res.status(StatusCodes.FAILED_DEPENDENCY).json({
                message: 'The email address has been rejected by the mail server',
            })
        }

        return res.status(StatusCodes.OK).json({
            message: 'Reset password link email has been sent',
        })
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to send reset password link email',
        })
    }
}

const resetPassword = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(ResetPasswordDto, req.body, {excludeExtraneousValues: true})

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

const logout = (req: Request, res: Response) => res
    .status(StatusCodes.NO_CONTENT)
    .clearCookie(accessTokenCookieName, {
        domain: jwtCookieDomain,
        path: '/',
    })
    .clearCookie(refreshTokenCookieName, {
        domain: jwtCookieDomain,
        path: '/',
    })
    .send()

const getUser = (req: Request, res: Response) => res.json(instanceToPlain(new UserResource(req.user as User)))

const updateProfile = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(UpdateProfileDto, req.body, {excludeExtraneousValues: true})

    try {
        const user = await authService.updateProfile(dto, req.user as User)

        return instanceToPlain(new UserResource(user))
    } catch (error) {
        console.log(error)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update profile',
        })
    }
}

const updatePassword = async (req: Request, res: Response) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return sendValidationErrorResponse(res, errors.array())
    }

    const dto = plainToInstance(UpdatePasswordDto, req.body, {excludeExtraneousValues: true})

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

export {
    register,
    login,
    refresh,
    forgotPassword,
    resetPassword,
    logout,
    getUser,
    updateProfile,
    updatePassword,
}
