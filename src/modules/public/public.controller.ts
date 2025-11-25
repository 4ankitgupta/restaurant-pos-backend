import { type Request, type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import prisma from "../../db/index.js";

export const getPublicBill = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Token is required");
    }

    // Find order by token
    const order = await prisma.order.findUnique({
      where: { billAccessToken: token },
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
            phone: true,
            logoUrl: true,
            gstin: true,
          },
        },
        table: {
          select: {
            tableNumber: true,
          },
        },
        orderItems: {
          include: {
            menuItemVariant: {
              include: {
                menuItem: {
                  select: {
                    name: true,
                    nameHindi: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Bill not found or link expired"
      );
    }

    // Check if token is expired
    if (order.billTokenExpiresAt && order.billTokenExpiresAt < new Date()) {
      throw new ApiError(httpStatus.GONE, "This bill link has expired");
    }

    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, order, "Bill retrieved successfully")
      );
  }
);
