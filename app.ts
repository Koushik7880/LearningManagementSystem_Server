require('dotenv').config()
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import { ErrorMiddleware } from './middleware/error'
import userRouter from './routes/user.route'

export const app = express()

// Body parser
app.use(express.json({ limit: '50mb' }))

// Cookie parser
app.use(cookieParser())

// CORS

// const corsOptions = {
//   origin: process.env.ORIGIN,
// };
const corsOptions = {
  origin: process.env.ORIGIN?.split(',') || '*', // Split the ORIGIN variable into an array or default to '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}

app.use(cors(corsOptions))

// Routes
// app.get('/', (req: Request, res: Response) => {
//   res.status(200).json({ message: 'Welcome to the root route' })
// })
app.use('/api/v1', userRouter)

// Testing API
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the API',
  })
})

// Unknown route
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any
  err.statusCode = 404
  next(err)
})

// Error middleware
app.use(ErrorMiddleware)
