import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import OrderModel from "../models/orderModel";



// create new order
export const newOrder = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
        const order = await OrderModel.create(data);
        // next(order);

        res.status(201).json({
                success: true,
                order,
            });
})

 // get all Orders 
 export const getAllOrdersService = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
        const orders = await OrderModel.find().sort({createdAt:-1});

        res.status(201).json({
            success:true,
            orders,
        })
    })