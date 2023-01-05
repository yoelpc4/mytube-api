import dotenv from 'dotenv'
import express, { Request, Response } from 'express'

dotenv.config()

const port = process.env.APP_PORT

const app = express()

app.get('/', (req: Request, res: Response) => {
    return res.send('MyTube')
})

app.listen(port, () => console.log(`Server is listening on port ${port}`))
