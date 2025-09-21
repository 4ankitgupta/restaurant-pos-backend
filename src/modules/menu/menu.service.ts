import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MenuService {
  async getAllMenus() {
    return prisma.menuItem.findMany();
  }

  async getMenuById(id: string) {
    return prisma.menuItem.findUnique({ where: { id } });
  }

  async createMenu(data: any) {
    return prisma.menuItem.create({ data });
  }

  async updateMenu(id: string, data: any) {
    return prisma.menuItem.update({ where: { id }, data });
  }

  async deleteMenu(id: string) {
    return prisma.menuItem.delete({ where: { id } });
  }
}
