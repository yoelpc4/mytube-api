import cookieParser from 'cookie-parser';
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'
import hpp from 'hpp';
import { join } from 'path'
import { cwd } from 'process'
import 'reflect-metadata'
import router from '@/router'
import { auth } from '@/utils'

dotenv.config()

const port = process.env.APP_PORT ?? 3000

const app = express()

app.use(helmet({
    crossOriginResourcePolicy: {
        policy: 'cross-origin',
    },
}))

app.use(hpp())

app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN?.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['accept', 'content-type', 'x-csrf-token'],
    credentials: true,
}))

app.use(cookieParser())

app.use(express.json())

app.use(express.urlencoded({
    extended: true,
}))

app.use(express.static('public'))

app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100mb
    },
    tempFileDir: join(cwd(), 'temp'),
    useTempFiles: true,
}))

auth.setup(app)

app.set('trust proxy', 1) // troubleshoot proxy issue on rate limit

app.use('/', router)

app.listen(port, () => console.log(`Server is listening on port ${port}`))
