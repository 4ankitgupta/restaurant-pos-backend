import { type Request, type Response } from "express";
import { MenuService } from "./menu.service";

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  public async getAllMenus(req: Request, res: Response): Promise<Response> {
    try {
      const menus = await this.menuService.getAllMenus();
      return res.status(200).json(menus);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving menus" });
    }
  }

  public async getMenuById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    try {
      const menu = await this.menuService.getMenuById(id);
      if (!menu) {
        return res.status(404).json({ message: "Menu not found" });
      }
      return res.status(200).json(menu);
    } catch (error) {
      return res.status(500).json({ message: "Error retrieving menu" });
    }
  }

  public async createMenu(req: Request, res: Response): Promise<Response> {
    const menuData = req.body;
    try {
      const newMenu = await this.menuService.createMenu(menuData);
      return res.status(201).json(newMenu);
    } catch (error) {
      return res.status(500).json({ message: "Error creating menu" });
    }
  }

  public async updateMenu(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const menuData = req.body;
    try {
      const updatedMenu = await this.menuService.updateMenu(id, menuData);
      if (!updatedMenu) {
        return res.status(404).json({ message: "Menu not found" });
      }
      return res.status(200).json(updatedMenu);
    } catch (error) {
      return res.status(500).json({ message: "Error updating menu" });
    }
  }

  public async deleteMenu(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    try {
      const deleted = await this.menuService.deleteMenu(id);
      if (!deleted) {
        return res.status(404).json({ message: "Menu not found" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Error deleting menu" });
    }
  }
}
