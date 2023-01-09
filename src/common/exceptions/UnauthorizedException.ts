import { StatusCodes } from 'http-status-codes';

export class UnauthorizedException extends Error {
    code = StatusCodes.UNAUTHORIZED

    constructor(message = 'Unauthenticated') {
        super(message)
    }
}
