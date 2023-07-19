import { Expose, Transform } from 'class-transformer';
import { UserResource } from '@/auth/resources';
import { ContentResource } from '@/content/resources';

export class ContentViewResource {
    id: number

    @Expose()
    @Transform(({ value }) => value ? new ContentResource(value) : null, { toPlainOnly: true })
    content?: ContentResource

    contentId?: number

    @Expose()
    @Transform(({ value }) => value ? new UserResource(value) : null, { toPlainOnly: true })
    user?: UserResource | null

    userId?: number | null

    createdAt?: Date

    updatedAt?: Date

    constructor(data: Partial<ContentViewResource>) {
        Object.assign(this, data)
    }
}
