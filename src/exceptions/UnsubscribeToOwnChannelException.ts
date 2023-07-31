export class UnsubscribeToOwnChannelException extends Error {
    channelId: Number

    constructor(affectedChannelId: Number, message = 'Unable to unsubscribe to own channel') {
        super(message)

        this.channelId = affectedChannelId
    }
}
