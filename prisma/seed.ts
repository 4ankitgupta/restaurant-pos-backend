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
  console.log(`✅ Created waiter user: ${cashier.email}`);

  const chef = await prisma.user.create({
    data: {
      name: "Chef User",
      email: "chef@vishalparatha.com",
      passwordHash: hashedPassword,
      role: UserRole.KITCHEN_STAFF,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Created waiter user: ${chef.email}`);

  // 4. Create Menu Categories
  const Starters = await prisma.menuCategory.create({
    data: {
      name: "Starters",
      restaurantId: restaurant.id,
    },
  });

  const rice_biryani = await prisma.menuCategory.create({
    data: {
      name: "Rice & Biryani",
      restaurantId: restaurant.id,
    },
  });

  const Bread = await prisma.menuCategory.create({
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
      name: "deserts",
      restaurantId: restaurant.id,
    },
  });
  console.log("✅ Created menu categories");

  // 5. Create Menu Items
  await prisma.menuItem.createMany({
    data: [
      // --- Starters ---
      {
        name: "Paneer Tikka",
        price: 180,
        categoryId: Starters.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Veg Samosa (2 pcs)",
        price: 60,
        categoryId: Starters.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Chicken Pakora",
        price: 200,
        categoryId: Starters.id,
        restaurantId: restaurant.id,
      },

      // --- Rice & Biryani ---
      {
        name: "Veg Pulao",
        price: 150,
        categoryId: rice_biryani.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Hyderabadi Chicken Biryani",
        price: 280,
        categoryId: rice_biryani.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Mutton Dum Biryani",
        price: 350,
        categoryId: rice_biryani.id,
        restaurantId: restaurant.id,
      },

      // --- Bread ---
      {
        name: "Butter Naan",
        price: 40,
        categoryId: Bread.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Garlic Naan",
        price: 60,
        categoryId: Bread.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Tandoori Roti",
        price: 25,
        categoryId: Bread.id,
        restaurantId: restaurant.id,
      },

      // --- Main Courses ---
      {
        name: "Paneer Butter Masala",
        price: 220,
        categoryId: mainCourses.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Dal Tadka",
        price: 160,
        categoryId: mainCourses.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Butter Chicken",
        price: 280,
        categoryId: mainCourses.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Rogan Josh (Mutton Curry)",
        price: 340,
        categoryId: mainCourses.id,
        restaurantId: restaurant.id,
      },

      // --- Deserts ---
      {
        name: "Gulab Jamun (2 pcs)",
        price: 80,
        categoryId: deserts.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Rasgulla (2 pcs)",
        price: 80,
        categoryId: deserts.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Kulfi Falooda",
        price: 120,
        categoryId: deserts.id,
        restaurantId: restaurant.id,
      },
      {
        name: "Kesar Pista Ice Cream",
        price: 100,
        categoryId: deserts.id,
        restaurantId: restaurant.id,
      },
    ],
  });
  console.log("✅ Created menu items");

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
