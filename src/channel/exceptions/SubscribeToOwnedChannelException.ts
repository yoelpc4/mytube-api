import { StatusCodes } from 'http-status-codes';

export class SubscribeToOwnedChannelException extends Error {
    code = StatusCodes.BAD_REQUEST

    constructor(message = 'Unable to subscribe to the owned channel') {
        super(message)
    }
}
