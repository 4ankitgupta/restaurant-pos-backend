import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
} from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

// Controller for user registration (typically by Admin/Manager)
export const registerUserController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await registerUser({
      ...req.body,
      restaurantId: req.user?.restaurantId, // Assign user to the admin's restaurant
    });
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          user,
          "User registered successfully"
        )
      );
  }
);

// Controller for user login
export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await loginUser(req.body);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res
      .status(httpStatus.OK)
      .cookie("accessToken", data.tokens.accessToken, cookieOptions)
      .cookie("refreshToken", data.tokens.refreshToken, cookieOptions)
      .json(
        new ApiResponse(httpStatus.OK, data, "User logged in successfully")
      );
  }
);

// Controller for updating a user
export const updateUserController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new Error("user ID is required");
    }
    if (!restaurantId) {
      throw new Error("Restaurant ID is required");
    }
    const user = await updateUser(id, req.body, restaurantId);
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, user, "User updated successfully"));
  }
);

// Controller for deleting a user
export const deleteUserController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error("user ID is required");
    }
    const result = await deleteUser(id, req.user?.restaurantId!, req.user!);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, result));
  }
);
