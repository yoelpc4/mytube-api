export class NeverSubscribedToChannelException extends Error {
    channelId: Number

    constructor(affectedChannelId: Number, message = 'Never subscribed to the channel') {
        super(message)

        this.channelId = affectedChannelId
    }
}
