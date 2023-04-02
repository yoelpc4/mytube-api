import { StatusCodes } from 'http-status-codes';

export class UnsubscribeToOwnedChannelException extends Error {
    code = StatusCodes.BAD_REQUEST

    constructor(message = 'Unable to unsubscribe to the owned channel') {
        super(message)
    }
}
