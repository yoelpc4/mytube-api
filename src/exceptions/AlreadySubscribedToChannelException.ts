export class AlreadySubscribedToChannelException extends Error {
    channelId: Number

    constructor(affectedChannelId: Number, message = 'Already subscribed to the channel') {
        super(message)

        this.channelId = affectedChannelId
    }
}
