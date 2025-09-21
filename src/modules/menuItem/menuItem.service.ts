import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MenuItemService {
  async getAllMenuItems(restaurantId: string) {
    return prisma.menuItem.findMany({ where: { restaurantId } });
  }

  async getMenuItemById(id: string, restaurantId: string) {
    return prisma.menuItem.findFirst({ where: { id, restaurantId } });
  }

  async createMenuItem(data: any, restaurantId: string) {
    return prisma.menuItem.create({ data: { ...data, restaurantId } });
  }

  async updateMenuItem(id: string, data: any, restaurantId: string) {
    // @ts-ignore
    return prisma.menuItem.update({ where: { id, restaurantId }, data });
  }

  async deleteMenuItem(id: string, restaurantId: string) {
    // @ts-ignore
    return prisma.menuItem.delete({ where: { id, restaurantId } });
  }
}
