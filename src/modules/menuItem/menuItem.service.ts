import prisma from "../../db/index.js";

export class MenuItemService {
  async getAllMenuItems(restaurantId: string) {
    // Include variants when fetching all menu items
    return prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        variants: true,
      },
    });
  }

  async getMenuItemById(id: string, restaurantId: string) {
    // Include variants when fetching a single menu item
    return prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: {
        variants: true,
      },
    });
  }

  async createMenuItem(data: any, restaurantId: string) {
    const {
      name,
      nameHindi,
      description,
      descriptionHindi,
      categoryId,
      variants,
    } = data;

    // Use a nested write to create the item and its variants in one transaction
    return prisma.menuItem.create({
      data: {
        name,
        ...(nameHindi && { nameHindi }),
        description,
        ...(descriptionHindi && { descriptionHindi }),
        categoryId,
        restaurantId,
        variants: {
          create: variants.map((variant: any) => ({
            name: variant.name,
            ...(variant.nameHindi && { nameHindi: variant.nameHindi }),
            price: variant.price,
            restaurantId: restaurantId, // Ensure tenancy on the variant
          })),
        },
      },
      include: {
        variants: true, // Return the new item with its variants
      },
    });
  }

  async updateMenuItem(id: string, data: any, restaurantId: string) {
    const {
      name,
      nameHindi,
      description,
      descriptionHindi,
      categoryId,
      variants,
    } = data;

    // Prepare data for the main menu item update
    const menuDataToUpdate: any = {
      name,
      description,
      categoryId,
    };
    if (nameHindi !== undefined) {
      menuDataToUpdate.nameHindi = nameHindi;
    }
    if (descriptionHindi !== undefined) {
      menuDataToUpdate.descriptionHindi = descriptionHindi;
    }

    // If variants are provided, we replace the old ones with the new ones.
    // This is done by deleting all existing variants and creating the new set.
    if (variants && Array.isArray(variants)) {
      menuDataToUpdate.variants = {
        // Delete all variants associated with this menu item
        deleteMany: {},
        // Create the new list of variants
        create: variants.map((variant: any) => ({
          name: variant.name,
          ...(variant.nameHindi && { nameHindi: variant.nameHindi }),
          price: variant.price,
          restaurantId: restaurantId, // Ensure tenancy
        })),
      };
    }

    // @ts-ignore
    return prisma.menuItem.update({
      where: { id, restaurantId },
      data: menuDataToUpdate,
      include: {
        variants: true, // Return the updated item with its variants
      },
    });
  }

  async deleteMenuItem(id: string, restaurantId: string) {
    // No change needed here.
    // The `onDelete: Cascade` in your schema.prisma ensures
    // that when a MenuItem is deleted, its associated MenuItemVariants are also deleted.
    // @ts-ignore
    return prisma.menuItem.delete({ where: { id, restaurantId } });
  }
}
