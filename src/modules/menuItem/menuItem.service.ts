import prisma from "../../db/index.js";

export class MenuItemService {
  async getAllMenuItems(restaurantId: string) {
    // Include variants when fetching all menu items
    return prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        variants: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getMenuItemById(id: string, restaurantId: string) {
    // Include variants when fetching a single menu item
    return prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: {
        variants: {
          orderBy: { sortOrder: "asc" },
        },
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
      isFavorite,
      sortOrder,
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
        ...(isFavorite !== undefined && { isFavorite }),
        ...(sortOrder !== undefined && { sortOrder }),
        variants: {
          create: variants.map((variant: any, index: number) => ({
            name: variant.name,
            ...(variant.nameHindi && { nameHindi: variant.nameHindi }),
            price: variant.price,
            restaurantId: restaurantId, // Ensure tenancy on the variant
            sortOrder:
              variant.sortOrder !== undefined ? variant.sortOrder : index,
          })),
        },
      },
      include: {
        variants: {
          orderBy: { sortOrder: "asc" },
        },
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
      isFavorite,
      sortOrder,
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
    if (isFavorite !== undefined) {
      menuDataToUpdate.isFavorite = isFavorite;
    }
    if (sortOrder !== undefined) {
      menuDataToUpdate.sortOrder = sortOrder;
    }

    // If variants are provided, we replace the old ones with the new ones.
    // This is done by deleting all existing variants and creating the new set.
    if (variants && Array.isArray(variants)) {
      menuDataToUpdate.variants = {
        // Delete all variants associated with this menu item
        deleteMany: {},
        // Create the new list of variants
        create: variants.map((variant: any, index: number) => ({
          name: variant.name,
          ...(variant.nameHindi && { nameHindi: variant.nameHindi }),
          price: variant.price,
          restaurantId: restaurantId, // Ensure tenancy
          sortOrder:
            variant.sortOrder !== undefined ? variant.sortOrder : index,
        })),
      };
    }

    // @ts-ignore
    return prisma.menuItem.update({
      where: { id, restaurantId },
      data: menuDataToUpdate,
      include: {
        variants: {
          orderBy: { sortOrder: "asc" },
        },
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

  async reorderMenuItems(itemIds: string[], restaurantId: string) {
    // Verify all items belong to this restaurant
    const items = await prisma.menuItem.findMany({
      where: { id: { in: itemIds }, restaurantId },
    });

    if (items.length !== itemIds.length) {
      throw new Error("Invalid menu item IDs");
    }

    // Update sortOrder for each item in a transaction
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.menuItem.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return this.getAllMenuItems(restaurantId);
  }
}
