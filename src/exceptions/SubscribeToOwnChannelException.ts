export class SubscribeToOwnChannelException extends Error {
    channelId: Number

    constructor(affectedChannelId: Number, message = 'Unable to subscribe to own channel') {
        super(message)

        this.channelId = affectedChannelId
    }
}
