import { ContentStatus } from '@prisma/client';
import { Expose } from 'class-transformer';
import { UploadedFile } from 'express-fileupload';

export class UpdateContentDto {
    @Expose()
    title: string

    @Expose()
    description?: string

    @Expose()
    thumbnail?: UploadedFile

    @Expose()
    tags?: string

    @Expose()
    status: ContentStatus
}
