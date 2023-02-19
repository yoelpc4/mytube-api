import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fileUpload from 'express-fileupload';
import passport from 'passport';
import { join } from 'path';
import { cwd } from 'process';
import router from './router';
import { configureStrategy } from './auth/utils';
import 'reflect-metadata'

dotenv.config()

const port = process.env.APP_PORT || 3000

const app = express()

app.use(cors())
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

app.use(passport.initialize())
configureStrategy(passport)

app.use('/', router)

app.listen(port, () => console.log(`Server is listening on port ${port}`))
