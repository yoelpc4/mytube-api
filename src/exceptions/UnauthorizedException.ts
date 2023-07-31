import { StatusCodes } from 'http-status-codes'

export class UnauthorizedException extends Error {
    code = StatusCodes.UNAUTHORIZED

    constructor(message = "The given credentials doesn't match our records") {
        super(message)
    }
}
