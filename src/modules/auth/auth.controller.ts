import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { registerUser, loginUser } from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

// Controller for user registration (typically by Admin/Manager)
export const registerUserController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Note: In a real app, you might want to ensure only ADMIN/MANAGER can register
    // This can be done via the `authorizeRoles` middleware on the route
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

    // Set cookie options
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
