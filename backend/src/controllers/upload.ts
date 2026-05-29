import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import sharp from 'sharp'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    try {
        let metadata
        const newFile = req.file
        const minFile = 2 * 1024
        const maxfile = 10 * 1024 * 1024
        
        if (newFile.size < minFile) {
            return next(
                new BadRequestError('Файл должен быть более 2 Кб')
            )
        }
        if (newFile.size > maxfile) {
            return next(
                new BadRequestError('Файл должен быть менее 10 Мб')
            )
        }
        if (!newFile.mimetype.startsWith('image/')) {
            return next(new BadRequestError('Неверный формат изображения'))
        }

        try {
            metadata = await sharp(newFile.path).metadata()
        } catch {
            return next(
                new BadRequestError(
                    'Файл повреждён'
                )
            )
        }

        if (!metadata.width || !metadata.height) {
            return next(new BadRequestError('Некорректное изображение'))
        }

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${newFile.filename}`
            : `/${newFile.filename}`
            
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
