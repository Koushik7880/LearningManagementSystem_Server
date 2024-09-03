import cloudinary from 'cloudinary'
import ejs from 'ejs'
import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import CourseModel from '../models/course.model'
import { createCourse, getAllCoursesService } from '../services/course.service'
import ErrorHandler from '../utils/ErrorHandler'
import { redis } from '../utils/redis'
import sendMail from '../utils/sendMail'
import NotificationModel from '../models/notificationModel'

// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Request body:', req.body) // Log the incoming request body
      const data = req.body
      const thumbnail = data.thumbnail
      if (thumbnail) {
        console.log('Skipping Cloudinary upload for now.')
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses',
        })

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }

      console.log('Final course data before saving:', data) // Log the final data to be saved
      createCourse(data, res, next)
    } catch (error: any) {
      console.error('Error during course upload:', error.message) // Log the error message
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

// edit course

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(data.thumbnail.public_id)

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses',
        })

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }

      const courseId = req.params.id
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      )

      res.status(201).json({
        success: true,
        // message: "Course updated successfully",
        course,
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

// get single course    ---- without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // const courseId = req.params.id;
    try {
      const courseId = req.params.id

      const isCacheExist = await redis.get(courseId)

      if (isCacheExist) {
        // console.log("hitting redisDB");
        const course = JSON.parse(isCacheExist)

        return res.status(200).json({
          success: true,
          course,
        })
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
        )

        // console.log("hitting mongodb");
        await redis.set(courseId, JSON.stringify(course))
        res.status(200).json({
          success: true,
          course,
        })
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

// get all courses without purchasing
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get('allCourses')
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist)
        console.log('hitting redisDB')

        return res.status(200).json({
          success: true,
          courses,
        })
      } else {
        const courses = await CourseModel.find().select(
          '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
        )

        await redis.set('allCourses', JSON.stringify(courses))
        console.log('hitting mongodb')

        res.status(200).json({
          success: true,
          courses,
        })
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

// get course content -- only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id

      console.log('courseId', courseId)

      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      )

      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 404)
        )
      }

      const course = await CourseModel.findById(courseId)

      const content = course?.courseData

      res.status(200).json({
        success: true,
        content,
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

// add question in course
interface IAddQuestionData {
  question: string
  courseId: string
  contentId: string
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body
      const course = await CourseModel.findById(courseId)

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      )

      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      // create a new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      }

      // add the question to our course content

      courseContent.questions.push(newQuestion)

      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Reveived",
        message: `You have a new question from ${courseContent.title}`,
    });

      // save the updated course
      await course?.save()

      res.status(200).json({
        success: true,
        course,
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

//  add answer in course question

interface IAddAnswerData {
  answer: string
  courseId: string
  contentId: string
  questionId: string
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body

      const course = await CourseModel.findById(courseId)

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      )

      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400))
      }

      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      )

      if (!question) {
        return next(new ErrorHandler('Invalid question id', 400))
      }

      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      }

      // add this answer to our course content
      question.questionReplies?.push(newAnswer)

      await course?.save()

      if (req.user?._id === question.user._id) {
        // create a notification
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Received",
          message: `You have a new reply on your question from ${courseContent.title}`
        })
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        }

        const html = await ejs.renderFile(
          path.join(__dirname, '../mails/question-reply.ejs'),
          data
        )

        try {
          console.log('Sending email to:', question.user.email)
          await sendMail({
            email: question.user.email,
            subject: 'Question Reply',
            template: 'question-reply.ejs',
            data,
          })
          console.log('Email sent successfully!')
        } catch (error: any) {
          console.error('Failed to send email:', error)
          return next(new ErrorHandler('Failed to send email', 500))
        }
      }

      res.status(200).json({
        success: true,
        course,
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

// add review in course
interface IAddReviewData {
  review: string
  rating: number
  userId: string
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses

      const courseId = req.params.id

      // check if courseId already in userCourseList based on _id

      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      )

      console.log('User Course List:', userCourseList)
      console.log('Course ID:', courseId)

      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 404)
        )
      }

      const course = await CourseModel.findById(courseId)

      const { review, rating } = req.body as IAddReviewData

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      }

      course?.reviews.push(reviewData)

      let avg = 0

      course?.reviews.forEach((rev: any) => {
        avg += rev.rating
      })

      if (course) {
        course.ratings = avg / course.reviews.length // one example we have 2 reviews one is 5 another is 4 so math working like this = 5 + 4 =  9 / 2 = 4.5
      }

      await course?.save()

      const notification = {
        title: 'New Review Received',
        message: `${req.user?.name} has given a review in ${course?.name}`,
      }

      // create a notification

      res.status(200).json({
        success: true,
        course,
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

// Add reply in course review
interface IAddReviewReplyData {
  comment: string
  courseId: string
  reviewId: string
}

export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewReplyData

      const course = await CourseModel.findById(courseId)

      if (!course) {
        return next(new ErrorHandler('Course not found', 404))
      }

      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId
      )

      if (!review) {
        return next(new ErrorHandler('Review not found', 404))
      }

      const replyData:any = {
        user: req.user,
        comment
      };

      // course.reviews?.commentReplies.push(replyData);
      if(!review.commentReplies){
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);

      await course.save();

      res.status(200).json({
        success: true,
        course
      })

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500))
    }
  }
)

 // get all courses --- only for admin
 export const getAllUsers = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    getAllCoursesService (req, res);
  } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
  }
})