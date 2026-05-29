import { Router } from 'express'
import { celebrate, Joi } from 'celebrate'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import  auth, { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'


const customerRouter = Router()

customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), getCustomers)
customerRouter.get(
    '/:id',  
    celebrate({
        params: Joi.object({
            id: Joi.string().hex().length(24).required(),
        }),
    }),
    auth, 
    getCustomerById,
)
customerRouter.patch('/:id', auth, updateCustomer)
customerRouter.delete('/:id', auth, deleteCustomer)

export default customerRouter
