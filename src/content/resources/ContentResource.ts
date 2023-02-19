import { Expose, Transform } from 'class-transformer';
import { join } from 'path';
import { UserResource } from '../../auth/resources';
import { getFileUrl } from '../../helpers';

export class ContentResource {
    id: number

    title: string

    description: string | null

    videoBasename: string

    @Expose()
    @Transform(({ obj }) => getFileUrl(join('videos', obj.videoBasename)), { toPlainOnly: true })
    videoUrl: string;

    tags: string | null

    status: string

    thumbnailBasename: string | null

    @Expose()
    @Transform(({ obj }) => obj.thumbnailBasename ? getFileUrl(join('thumbnails', obj.thumbnailBasename)) : null, { toPlainOnly: true })
    thumbnailUrl: string | null;

    createdAt: Date

    updatedAt: Date

    @Expose()
    @Transform(({ value }) => value ? new UserResource(value) : null, { toPlainOnly: true })
    createdBy?: UserResource

    createdById: number

    constructor(data: Partial<ContentResource>) {
        Object.assign(this, data)
    }
}
