import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel, { IOrder } from "../models/orderModel";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notificationModel";
import { getAllOrdersService, newOrder } from "../services/order.service";
// import { getAllUsersService } from "../services/user.service";


// create order
export const createOrder = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const {courseId, payment_info} = req.body as IOrder;

            const user = await userModel.findById(req.user?._id);

            const courseExistInUser = user?.courses.some((course:any) => course._id.toString() === courseId);

            if(courseExistInUser){
                return next(new ErrorHandler('You have already purchase this course', 404));
            }

            const course = await CourseModel.findById(courseId);

            // interface Course {
            //     purchased: any;
            //     _id: string;
            //     name: string;
            //     price: number;
            //   }
              
            //   const course: Course | null = await CourseModel.findById(courseId);

            

            if(!course){
                return next(new ErrorHandler('Course not found', 404));
            }

            const data:any = {
                courseId:course._id,
                userId: user?._id,
                payment_info,
            }

            const mailData = {
                order: {
                    _id: course._id.toString().slice(0, 6),
                    name: course.name,
                    price: course.price,
                    date: new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}),
                }
            }

            const html = await ejs.renderFile(path.join(__dirname, '../mails/order-confirmation.ejs'), {order: mailData});

            try {
                if(user){
                    await sendMail({
                        email: user.email,
                        subject: "Order Confirmation",
                        template: "order-confirmation.ejs",
                        data: mailData,
                    })
                }
                
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }

            user?.courses.push({courseId: course?._id});

            await user?.save();

            await NotificationModel.create({
                user: user?._id,
                title: "New Order",
                message: `You have a new order from ${course?.name}`,
            });

           

            // course.purchased ? course.purchased += 1 : course.purchased;
            // Initialize the `purchased` field if it doesn't exist
            if (course.purchased === undefined || course.purchased === null) {
                course.purchased = 1;
            } else {
                course.purchased += 1;
            }


            console.log("course.purchased", course.purchased);
            
            await course.save();
            
            newOrder(data, res, next);

            

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    })

    // get all Orders --- only for admin
    export const getAllOrders = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllOrdersService(req, res, next);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    })

 