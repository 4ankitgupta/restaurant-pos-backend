import { type Request, type Response } from "express";
import { UserService } from "./users.service.js";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { type UserRole } from "@prisma/client";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers(
        req.user?.restaurantId,
        req.user?.role as UserRole
      );
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving users" });
    }
  }

  public async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    try {
      const user = await this.userService.getUserById(
        id,
        req.user?.restaurantId,
        req.user?.role as UserRole
      );
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error retrieving user" });
    }
  }

  public async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const newUser = await this.userService.createUser(
        req.body,
        req.user?.restaurantId,
        req.user?.role as UserRole
      );
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  }

  public async updateUser(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    try {
      const updatedUser = await this.userService.updateUser(
        id,
        req.body,
        req.user?.restaurantId,
        req.user?.role as UserRole
      );
      if (updatedUser) {
        res.status(200).json(updatedUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  }

  public async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    try {
      const deleted = await this.userService.deleteUser(
        id,
        req.user?.restaurantId,
        req.user?.role as UserRole
      );
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  }

  public async changePassword(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { adminPassword, newPassword } = req.body;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      await this.userService.changePassword(
        id,
        req.user.id,
        adminPassword,
        newPassword,
        req.user?.restaurantId,
        req.user?.role as UserRole
      );
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error: any) {
      if (error.statusCode === 401) {
        res
          .status(401)
          .json({ message: error.message || "Incorrect admin password" });
      } else if (error.statusCode === 404) {
        res.status(404).json({ message: error.message || "User not found" });
      } else {
        res.status(500).json({ message: "Error changing password" });
      }
    }
  }
}
