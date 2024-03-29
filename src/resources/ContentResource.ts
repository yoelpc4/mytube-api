import { Content, Prisma } from '@prisma/client'
import { Exclude, Expose, Transform } from 'class-transformer'
import { UserResource } from '@/resources'
import { contentService } from '@/services';
import { filesystem } from '@/utils';

export class ContentResource {
    id: number

    title?: string

    description?: string | null

    videoBasename?: string

    @Expose()
    @Transform(({obj}) => filesystem.getUrl(contentService.getVideoPath(obj.videoBasename)), {toPlainOnly: true})
    videoUrl?: string

    tags?: string | null

    status?: string

    thumbnailBasename?: string | null

    @Expose()
    @Transform(({obj}) => obj.thumbnailBasename ? filesystem.getUrl(contentService.getThumbnailPath(obj.thumbnailBasename)) : null, {toPlainOnly: true})
    thumbnailUrl?: string | null

    createdAt?: Date

    updatedAt?: Date

    @Expose()
    @Transform(({value}) => value ? new UserResource(value) : null, {toPlainOnly: true})
    createdBy?: UserResource

    createdById?: number

    @Expose()
    @Transform(({obj}) => obj._count?.contentViews, {toPlainOnly: true})
    viewsCount?: number

    likesCount?: number

    dislikesCount?: number

    isLiked?: boolean

    isDisliked?: boolean

    @Expose()
    @Transform(({value}) => Array.isArray(value) ? value.map((relatedContent: Content) => new ContentResource(relatedContent)) : [], {toPlainOnly: true})
    relatedContents?: ContentResource[]

    @Exclude()
    _count?: Partial<Prisma.ContentCountOutputType>

    constructor(data: Partial<ContentResource>) {
        Object.assign(this, data)
    }
}
