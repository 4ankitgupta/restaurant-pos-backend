import { Router } from "express";
import type { Request, Response } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../../db/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

const router = Router();

// Extend Express Request type to include user and files
interface AuthRequest extends Request {
  user?: {
    userId: string;
    restaurantId: string;
    role: string;
  };
}

// Configure Multer for File Upload
const uploadDir = path.join(process.cwd(), "logos");
const qrCodesDir = path.join(process.cwd(), "qrcodes");

// Ensure directories exist
[uploadDir, qrCodesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    if (file.fieldname === "upiQrCode") {
      cb(null, qrCodesDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    if (file.fieldname === "upiQrCode") {
      cb(null, "qr-" + uniqueSuffix + path.extname(file.originalname));
    } else {
      cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
    }
  },
});

const upload = multer({ storage: storage });

// Helper function to delete old file
const deleteFileIfExists = (filePath: string) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted old file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }
};

// @route   GET /api/v1/restaurant
// @desc    Get current restaurant details
// @access  Private (Admin, Manager)
router.get(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phone2: true,
        gstin: true,
        logoUrl: true,
        upiQrCodeUrl: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!restaurant) {
      throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    }

    res.json(restaurant);
  })
);

// @route   PATCH /api/v1/restaurant
// @desc    Update restaurant details
// @access  Private (Admin only)
router.patch(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "upiQrCode", maxCount: 1 },
  ]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    const {
      name,
      email,
      phone,
      phone2,
      gstin,
      address,
      deleteLogo,
      deleteQrCode,
    } = req.body;

    // Get current restaurant data
    const currentRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { logoUrl: true, upiQrCodeUrl: true },
    });

    if (!currentRestaurant) {
      throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
    }

    const dataToUpdate: any = {};

    // Update text fields only if provided
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email || null;
    if (phone !== undefined) dataToUpdate.phone = phone || null;
    if (phone2 !== undefined) dataToUpdate.phone2 = phone2 || null;
    if (gstin !== undefined) dataToUpdate.gstin = gstin || null;
    if (address !== undefined) dataToUpdate.address = address || null;

    // Handle logo upload
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && typeof files === "object" && !Array.isArray(files)) {
      if (files.logo && files.logo[0]) {
        // Delete old logo if exists
        if (currentRestaurant.logoUrl) {
          const oldLogoPath = path.join(
            process.cwd(),
            currentRestaurant.logoUrl
          );
          deleteFileIfExists(oldLogoPath);
        }
        dataToUpdate.logoUrl = `/logos/${files.logo[0].filename}`;
      }

      if (files.upiQrCode && files.upiQrCode[0]) {
        // Delete old QR code if exists
        if (currentRestaurant.upiQrCodeUrl) {
          const oldQrPath = path.join(
            process.cwd(),
            currentRestaurant.upiQrCodeUrl
          );
          deleteFileIfExists(oldQrPath);
        }
        dataToUpdate.upiQrCodeUrl = `/qrcodes/${files.upiQrCode[0].filename}`;
      }
    }

    // Handle logo deletion
    if (deleteLogo === "true" || deleteLogo === true) {
      if (currentRestaurant.logoUrl) {
        const oldLogoPath = path.join(process.cwd(), currentRestaurant.logoUrl);
        deleteFileIfExists(oldLogoPath);
      }
      dataToUpdate.logoUrl = null;
    }

    // Handle QR code deletion
    if (deleteQrCode === "true" || deleteQrCode === true) {
      if (currentRestaurant.upiQrCodeUrl) {
        const oldQrPath = path.join(
          process.cwd(),
          currentRestaurant.upiQrCodeUrl
        );
        deleteFileIfExists(oldQrPath);
      }
      dataToUpdate.upiQrCodeUrl = null;
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phone2: true,
        gstin: true,
        logoUrl: true,
        upiQrCodeUrl: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedRestaurant);
  })
);

export default router;
