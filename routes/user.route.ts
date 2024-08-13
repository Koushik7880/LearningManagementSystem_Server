import express from 'express'
import { activateUser, getUserInfo, loginUser, logoutUser, registerUser, socialAuth, updateAccessToken } from '../controllers/user.controller'
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
const userRouter = express.Router()
userRouter.post('/registration', registerUser);

userRouter.post('/activate-user', activateUser);

userRouter.post('/login', loginUser);

userRouter.get('/logout', isAuthenticated, authorizeRoles("admin") ,logoutUser);

userRouter.get('/refresh', updateAccessToken);

userRouter.get('/me', isAuthenticated, getUserInfo );

userRouter.get('/social-auth', socialAuth);




export default userRouter
