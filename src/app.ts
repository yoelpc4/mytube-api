import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import passport from 'passport';
import router from './router';
import { configureStrategy } from './auth/utils';
import 'reflect-metadata'

dotenv.config()

const port = process.env.APP_PORT

const app = express()

app.use(cors())
app.use(express.json())

app.use(passport.initialize())
configureStrategy(passport)

app.use('/', router)

app.listen(port, () => console.log(`Server is listening on port ${port}`))
