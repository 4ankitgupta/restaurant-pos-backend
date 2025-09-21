import { type Request, type Response } from "express";
import { MenuItemService } from "./menuItem.service.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export class MenuItemController {
  private menuItemService: MenuItemService;

  constructor() {
    this.menuItemService = new MenuItemService();
  }

  public async getAllMenuItems(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }
    try {
      const menuItems = await this.menuItemService.getAllMenuItems(
        restaurantId
      );
      return res.status(200).json(menuItems);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving menu items" });
    }
  }

  public async getMenuItemById(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id || !restaurantId) {
      return res
        .status(400)
        .json({ message: "Menu Item ID and Restaurant ID are required" });
    }
    try {
      const menuItem = await this.menuItemService.getMenuItemById(
        id,
        restaurantId
      );
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      return res.status(200).json(menuItem);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving menu item" });
    }
  }

  public async createMenuItem(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const menuData = req.body;
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }
    try {
      const newMenuItem = await this.menuItemService.createMenuItem(
        menuData,
        restaurantId
      );
      return res.status(201).json(newMenuItem);
    } catch (error) {
      return res.status(500).json({ message: "Error creating menu item" });
    }
  }

  public async updateMenuItem(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const { id } = req.params;
    const menuData = req.body;
    const restaurantId = req.user?.restaurantId;
    if (!id || !restaurantId) {
      return res
        .status(400)
        .json({ message: "Menu Item ID and Restaurant ID are required" });
    }
    try {
      const updatedMenuItem = await this.menuItemService.updateMenuItem(
        id,
        menuData,
        restaurantId
      );
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      return res.status(200).json(updatedMenuItem);
    } catch (error) {
      return res.status(500).json({ message: "Error updating menu item" });
    }
  }

  public async deleteMenuItem(
    req: AuthRequest,
    res: Response
  ): Promise<Response> {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id || !restaurantId) {
      return res
        .status(400)
        .json({ message: "Menu Item ID and Restaurant ID are required" });
    }
    try {
      const deleted = await this.menuItemService.deleteMenuItem(
        id,
        restaurantId
      );
      if (!deleted) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Error deleting menu item" });
    }
  }
}
