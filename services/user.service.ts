
import userModel from "../models/user.model";
import { Response } from "express";
import { redis } from "../utils/redis";



// get user by id
export const getUserById = async (id: string, res: Response) => {
    const userJson = await redis.get(id);

    if(userJson){
        const user = JSON.parse(userJson as string);
        res.status(201).json({
            success:true,
            user,
        })
    };
    
    
}

// Get All Users
export const getAllUsersService = async (req: any, res: Response) => {
    const users = await userModel.find().sort({createdAt:-1});


    res.status(201).json({
        success:true,
        users,
    })

}

// update user role -- only for admin
// export const  updateUserRoleService = async (res: Response, id:string, role: string) => {
//     const user = await userModel.findByIdAndUpdate(id, { role }, { new:true });

//     res.status(201).json({
//         success:true,
//         user
//     })
// }

// update user role -- only for admin
export const updateUserRoleService = async (res: Response, id: string, role: string) => {
    try {
        const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
        console.log("user ID", user);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(201).json({
            success: true,
            user
        });
    } catch (error) {
        console.log("Error updating user role:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating user role"
        });
    }
}

