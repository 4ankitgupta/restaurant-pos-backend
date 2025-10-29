import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clean up existing data
  // The order is important to avoid foreign key constraint errors
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  // NEW: Delete variants before menu items
  await prisma.menuItemVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();

  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.superAdmin.deleteMany();

  await prisma.restaurant.deleteMany();

  const superAdminPassword = "superadmin123"; // Change this!
  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);

  await prisma.superAdmin.upsert({
    where: { email: "superadmin@rasoitrack.com" }, // Use a unique email
    update: {
      name: "Super Admin",
      passwordHash: hashedSuperAdminPassword,
    },
    create: {
      name: "Super Admin",
      email: "superadmin@rasoitrack.com",
      passwordHash: hashedSuperAdminPassword,
    },
  });
  console.log(
    `✅ Created Super Admin: superadmin@rasoitrack.com (Password: ${superAdminPassword})`
  );

  // 2. Create a Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Vishal Paratha",
      email: "contact@vishalparatha.com",
      phone: "9876543210",
      address: "GS ke pas, Indore",
    },
  });
  console.log(`✅ Created restaurant: ${restaurant.name}`);

  const trialPlan = await prisma.plan.create({
    data: {
      name: "Trial Plan",
      price: 0,
      features: {
        users: 5,
        tables: 10,
        orders: "unlimited",
      },
    },
  });
  console.log("✅ Created Trial Plan");

  await prisma.subscription.create({
    data: {
      restaurantId: restaurant.id,
      planId: trialPlan.id,
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
    },
  });
  console.log(`✅ Created Trial Subscription for ${restaurant.name}`);

  // 3. Create Users (Admin, Manager, Waiter, etc.)
  const password = "demo123"; // Use a secure password in a real app
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@vishalparatha.com",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Created admin user: ${admin.email} (Password: ${password})`);

  const manager = await prisma.user.create({
    data: {
      name: "Manager User",
      email: "manager@vishalparatha.com",
      passwordHash: hashedPassword,
      role: UserRole.MANAGER,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Created manager user: ${manager.email}`);

  const waiter = await prisma.user.create({
    data: {
      name: "Waiter User",
      email: "waiter@vishalparatha.com",
      passwordHash: hashedPassword,
      role: UserRole.WAITER,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Created waiter user: ${waiter.email}`);

  const cashier = await prisma.user.create({
    data: {
      name: "Cashier User",
      email: "cashier@vishalparatha.com",
      passwordHash: hashedPassword,
      role: UserRole.CASHIER,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Created cashier user: ${cashier.email}`);

  const chef = await prisma.user.create({
    data: {
      name: "Chef User",
      email: "chef@vishalparatha.com",
      passwordHash: hashedPassword,
      role: UserRole.KITCHEN_STAFF,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Created chef user: ${chef.email}`);

  // 4. Create Menu Categories
  const starters = await prisma.menuCategory.create({
    data: {
      name: "Starters",
      restaurantId: restaurant.id,
    },
  });

  const riceBiryani = await prisma.menuCategory.create({
    data: {
      name: "Rice & Biryani",
      restaurantId: restaurant.id,
    },
  });

  const bread = await prisma.menuCategory.create({
    data: {
      name: "Bread",
      restaurantId: restaurant.id,
    },
  });

  const mainCourses = await prisma.menuCategory.create({
    data: {
      name: "Main Courses",
      restaurantId: restaurant.id,
    },
  });

  const deserts = await prisma.menuCategory.create({
    data: {
      name: "Deserts",
      restaurantId: restaurant.id,
    },
  });
  console.log("✅ Created menu categories");

  // 5. Create Menu Items (Changed from createMany to individual create)

  console.log("Creating menu items with variants...");

  // --- Starters ---
  await prisma.menuItem.create({
    data: {
      name: "Paneer Tikka",
      categoryId: starters.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Regular",
          price: 180,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Veg Samosa (2 pcs)",
      categoryId: starters.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Plate",
          price: 60,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Chicken Pakora",
      categoryId: starters.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "Half", price: 120, restaurantId: restaurant.id },
          { name: "Full", price: 200, restaurantId: restaurant.id },
        ],
      },
    },
  });

  // --- Rice & Biryani ---
  await prisma.menuItem.create({
    data: {
      name: "Veg Pulao",
      categoryId: riceBiryani.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Plate",
          price: 150,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Hyderabadi Chicken Biryani",
      categoryId: riceBiryani.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "Half", price: 180, restaurantId: restaurant.id },
          { name: "Full", price: 280, restaurantId: restaurant.id },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Mutton Dum Biryani",
      categoryId: riceBiryani.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "Half", price: 220, restaurantId: restaurant.id },
          { name: "Full", price: 350, restaurantId: restaurant.id },
        ],
      },
    },
  });

  // --- Bread ---
  await prisma.menuItem.create({
    data: {
      name: "Butter Naan",
      categoryId: bread.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Piece",
          price: 40,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Garlic Naan",
      categoryId: bread.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Piece",
          price: 60,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Tandoori Roti",
      categoryId: bread.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Piece",
          price: 25,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  // --- Main Courses ---
  await prisma.menuItem.create({
    data: {
      name: "Paneer Butter Masala",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Regular",
          price: 220,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Dal Tadka",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Regular",
          price: 160,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Butter Chicken",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          { name: "Half", price: 180, restaurantId: restaurant.id },
          { name: "Full", price: 280, restaurantId: restaurant.id },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Rogan Josh (Mutton Curry)",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Regular",
          price: 340,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  // --- Deserts ---
  await prisma.menuItem.create({
    data: {
      name: "Gulab Jamun (2 pcs)",
      categoryId: deserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Plate",
          price: 80,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Rasgulla (2 pcs)",
      categoryId: deserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Plate",
          price: 80,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Kulfi Falooda",
      categoryId: deserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Glass",
          price: 120,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Kesar Pista Ice Cream",
      categoryId: deserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Scoop",
          price: 100,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  console.log("✅ Created menu items with variants");

  // 6. Create Tables
  await prisma.table.createMany({
    data: [
      { tableNumber: "T1", capacity: 4, restaurantId: restaurant.id },
      { tableNumber: "T2", capacity: 2, restaurantId: restaurant.id },
      { tableNumber: "T3", capacity: 6, restaurantId: restaurant.id },
      { tableNumber: "T4", capacity: 4, restaurantId: restaurant.id },
      { tableNumber: "T5", capacity: 6, restaurantId: restaurant.id },
      { tableNumber: "T6", capacity: 2, restaurantId: restaurant.id },
    ],
  });
  console.log("✅ Created tables");

  console.log("🎉 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma Client connection
    await prisma.$disconnect();
  });
