import { readFile } from 'fs/promises'
import { createTransport } from 'nodemailer'
import { compile } from 'handlebars';

const transport = createTransport({
    host: process.env.MAIL_HOST ?? 'localhost',
    port: +(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_SECURE === 'true',
    ...(process.env.MAIL_USER && process.env.MAIL_PASS && {
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        }
    }),
    logger: true,
})

export const sendEmail = async (to: string, subject: string, data: object, templatePath: string) => {
    try {
        const templateFile = await readFile(templatePath, 'utf8')

        const compiledTemplate = compile(templateFile)

        const options = {
            from: process.env.MAIL_FROM,
            to,
            subject,
            html: compiledTemplate(data),
        }

        const {accepted} = await transport.sendMail(options)

        return accepted.includes(to)
    } catch (error) {
        return Promise.reject(error)
    }
}
