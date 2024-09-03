import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import LayoutModel from "../models/layout.model";


// create layout
export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {type} = req.body;
        if(type === "Banner"){
            const {image, title, subTitle} = req.body;

            await LayoutModel.create({
                banner: {
                    image,
                    title,
                    subTitle
                }
            });
        }
    } catch (error: any) {
        
    }
});