require('dotenv').config()
import ejs from 'ejs'
import { NextFunction, Request, Response } from 'express'
import jwt, { Secret } from 'jsonwebtoken'
import path from 'path'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import userModel, { IUser } from '../models/user.model'
import ErrorHandler from '../utils/ErrorHandler'
import sendMail from '../utils/sendMail'

// register user
interface IRegistrationBody {
  name: string
  email: string
  password: string
  avatar?: string
  // avatar: {
  //     public_id: string;
  //     url: string;
  // };
}

// export const registerUser = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { name, email, password, avatar } = req.body
//       console.log("Received email from request body:", email); // Add this line

//       const isEmailExist = await userModel.findOne({ email })
//       if (isEmailExist) {
//         return next(new ErrorHandler('Email already exists', 400))
//       }
//       const user: IRegistrationBody = {
//         name,
//         email,
//         password,
//       }

//       const activationToken = createActivationToken(user)

//       const activationCode = activationToken.activationCode

//       const data = {
//         user: { name: user.name },
//         activationCode,
//       }
//       const html = await ejs.renderFile(
//         path.join(__dirname, '../mails/activation-mail.ejs'),
//         data
//       )
//       try {
//         await sendMail({
//           email: user.email,
//           subject: 'Activate your account',
//           template: 'activation-mail.ejs',
//           data,
//         })

//         return res.status(201).json({
//           success: true,
//           message: `Please check your email - ${user.email} to activate your account.`,
//           activationToken: activationToken.token,
//         })
//       } catch (error: any) {
//         return next(new ErrorHandler(error.message, 400))
//       }
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400))
//     }
//   }
// )

export const registerUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(
        'Received request method:',
        req.method,
        'Received request url:',
        req.url
      )
      console.log('Request body:', req.body) // Log the entire request body

      const { name, email, password, avatar } = req.body

      console.log('Received email from request body:', email) // Add this line

      const isEmailExist = await userModel.findOne({ email })
      if (isEmailExist) {
        return next(new ErrorHandler('Email already exists', 400))
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      }

      const activationToken = createActivationToken(user)

      const activationCode = activationToken.activationCode

      const data = {
        user: { name: user.name },
        activationCode,
      }

      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/activation-mail.ejs'),
        data
      )

      try {
        await sendMail({
          email: user.email, // Make sure this is not undefined
          subject: 'Activate your account',
          template: 'activation-mail.ejs',
          data,
        })

        return res.status(201).json({
          success: true,
          message: `Please check your email - ${user.email} to activate your account.`,
          activationToken: activationToken.token,
        })
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

interface IActivationToken {
  token: string
  activationCode: string
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString()

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: '5m',
    }
  )

  return { token, activationCode }
}


// activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
      const { activation_token, activation_code } = req.body as IActivationRequest;

      const newUser: {user: IUser; activationCode:string} = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as {user: IUser; activationCode:string};

      if(newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }
      
      const {name, email, password} = newUser.user;

      const existUser = await userModel.findOne({email});
      if(existUser) {
        return next(new ErrorHandler("Email already exists", 400));
      };

      const user = await userModel.create({ 
        name, 
        email, 
        password 
      });

      res.status(201).json({
        success: true,
        // message: "User registered successfully",
        // user
      });

  } 
  catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  }
})

// login user

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as ILoginRequest;
    if(!email || !password) {
      return next(new ErrorHandler("Please enter email and password", 400));
    }
    const user = await userModel.findOne({email}).select("+password");
    if(!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    // sendToken(user, 200, res);
  } 
  catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  }
})

function sendToken(user: import("mongoose").Document<unknown, {}, IUser> & IUser & Required<{ _id: unknown }>, arg1: number, res: Response<any, Record<string, any>>) {
  throw new Error('Function not implemented.')
}
