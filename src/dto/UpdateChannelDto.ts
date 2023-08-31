import { Expose } from 'class-transformer'
import { UploadedFile } from 'express-fileupload';

export class UpdateChannelDto {
    @Expose()
    name: string

    @Expose()
    username: string

    @Expose()
    email: string

    @Expose()
    profile?: UploadedFile

    @Expose()
    banner?: UploadedFile
}
