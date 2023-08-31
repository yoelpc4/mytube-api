import { cwd } from 'process';
import { UploadedFile } from 'express-fileupload';
import { rm, stat } from 'fs/promises';
import { extname, join } from 'path';

const apiUrl = process.env.API_URL

if (!apiUrl) {
    throw new Error('Undefined API URL')
}

const publicPath = join(cwd(), 'public')

const save = async (uploadedFile: UploadedFile, path: string) => {
    const filename = `${Date.now()}${Math.round(Math.random() * 1E9)}`

    const basename = `${filename}${extname(uploadedFile.name)}`

    await uploadedFile.mv(join(publicPath, path, basename))

    return basename
}

const remove = async (path: string) => {
    const normalizedPath = join(publicPath, path)

    const thumbnailStats = await stat(normalizedPath)

    if (thumbnailStats.isFile()) {
        await rm(normalizedPath)
    }
}

const getUrl = (path: string) => `${apiUrl}/${path}`

export {
    save,
    remove,
    getUrl,
}
