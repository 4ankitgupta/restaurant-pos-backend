import { type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import httpStatus from "http-status";
import * as agentService from "./agent.service.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export const handleChat = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { message, conversationId } = req.body as {
      message: string;
      conversationId?: string;
    };

    // authenticateJWT sets req.user; enforceTenancy ensures a restaurantId for non-superadmin
    const userId = req.user!.id;
    const restaurantId = req.user!.restaurantId;

    const params: {
      message: string;
      userId: string;
      restaurantId: string;
      conversationId?: string;
    } = {
      message,
      userId,
      restaurantId,
    };
    if (conversationId) params.conversationId = conversationId;

    const result = await agentService.getAgentResponse(params);

    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, result, "Message processed"));
  }
);
