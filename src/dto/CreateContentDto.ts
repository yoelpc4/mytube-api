import { Expose } from 'class-transformer'
import { UploadedFile } from 'express-fileupload'

export class CreateContentDto {
    @Expose()
    video: UploadedFile
}
