import { Response, NextFunction } from "express";
import CourseModel from "../models/course.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";

// create course
export const createCourse = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
    try {
        console.log("Creating course with data:", data); // Log the data used to create the course
        const course = await CourseModel.create(data);
        console.log("Course created successfully:", course); // Log the created course

        res.status(201).json({
            success: true,
            course,
        });
    } catch (error: any) {
        console.error("Error during course creation:", error.message); // Log any errors that occur during creation
        return next(new ErrorHandler(error.message, 500));
    }
});


// Get All Courses
export const getAllCoursesService = async (req: any, res: Response) => {
    const course = await CourseModel.find().sort({createdAt:-1});


    res.status(201).json({
        success:true,
        course,
    })

}