import { StatusCodes } from 'http-status-codes';

export class NotFoundException extends Error {
    code = StatusCodes.NOT_FOUND

    constructor(message = 'Not Found') {
        super(message)
    }
}
