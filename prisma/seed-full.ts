import {
  PrismaClient,
  UserRole,
  TableStatus,
  OrderStatus,
  OrderItemStatus,
  PaymentStatus,
  PaymentMethod,
  StockChangeType,
  PunchType,
} from "@prisma/client";
import bcrypt from "bcrypt";

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with comprehensive test data...");

  // 1. Clean up existing data (in correct order to avoid FK constraints)
  console.log("🧹 Cleaning existing data...");
  await prisma.chatMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.attendancePunch.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItemVariant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.superAdmin.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.announcement.deleteMany();

  // 2. Create Super Admin
  const superAdminPassword = "superadmin123";
  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);

  await prisma.superAdmin.create({
    data: {
      name: "Super Admin",
      email: "superadmin@rasoitrack.com",
      passwordHash: hashedSuperAdminPassword,
    },
  });
  console.log(`✅ Created Super Admin (Password: ${superAdminPassword})`);

  // 3. Create Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Vishal Paratha House",
      email: "contact@vishalparatha.com",
      phone: "+91-9876543210",
      address: "123 Main Street, Near GS Circle, Indore, MP 452001",
      featureFlags: {
        ai_chat: true,
        inventory: true,
        biometric_attendance: true,
        kitchen_display: true,
        online_orders: false,
      },
    },
  });
  console.log(`✅ Created restaurant: ${restaurant.name}`);

  // 4. Create Plans and Subscription
  const trialPlan = await prisma.plan.create({
    data: {
      name: "Trial Plan",
      price: 0,
      features: {
        users: 5,
        tables: 10,
        orders: "unlimited",
        inventory: true,
        reports: "basic",
      },
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: "Pro Plan",
      price: 2999,
      features: {
        users: 20,
        tables: 50,
        orders: "unlimited",
        inventory: true,
        reports: "advanced",
        ai_chat: true,
        multi_location: false,
      },
    },
  });
  console.log("✅ Created subscription plans");

  await prisma.subscription.create({
    data: {
      restaurantId: restaurant.id,
      planId: trialPlan.id,
      status: "ACTIVE",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Created subscription");

  // 5. Create Users
  const password = "demo123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Vishal Kumar",
      email: "admin@vishalparatha.com",
      phone: "+91-9876543210",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      restaurantId: restaurant.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "manager@vishalparatha.com",
      phone: "+91-9876543211",
      passwordHash: hashedPassword,
      role: UserRole.MANAGER,
      restaurantId: restaurant.id,
    },
  });

  const waiter1 = await prisma.user.create({
    data: {
      name: "Rahul Verma",
      email: "waiter1@vishalparatha.com",
      phone: "+91-9876543212",
      passwordHash: hashedPassword,
      role: UserRole.WAITER,
      restaurantId: restaurant.id,
    },
  });

  const waiter2 = await prisma.user.create({
    data: {
      name: "Anjali Patel",
      email: "waiter2@vishalparatha.com",
      phone: "+91-9876543213",
      passwordHash: hashedPassword,
      role: UserRole.WAITER,
      restaurantId: restaurant.id,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: "Amit Singh",
      email: "cashier@vishalparatha.com",
      phone: "+91-9876543214",
      passwordHash: hashedPassword,
      role: UserRole.CASHIER,
      restaurantId: restaurant.id,
    },
  });

  const chef1 = await prisma.user.create({
    data: {
      name: "Rajesh Gupta",
      email: "chef1@vishalparatha.com",
      phone: "+91-9876543215",
      passwordHash: hashedPassword,
      role: UserRole.KITCHEN_STAFF,
      restaurantId: restaurant.id,
    },
  });

  const chef2 = await prisma.user.create({
    data: {
      name: "Deepak Tiwari",
      email: "chef2@vishalparatha.com",
      phone: "+91-9876543216",
      passwordHash: hashedPassword,
      role: UserRole.KITCHEN_STAFF,
      restaurantId: restaurant.id,
    },
  });
  console.log(`✅ Created 7 users (Password for all: ${password})`);

  // 6. Create Employees
  const empWaiter1 = await prisma.employee.create({
    data: {
      name: "Rahul Verma",
      employeeCode: "EMP001",
      biometricId: "BIO001",
      restaurantId: restaurant.id,
      userId: waiter1.id,
    },
  });

  const empWaiter2 = await prisma.employee.create({
    data: {
      name: "Anjali Patel",
      employeeCode: "EMP002",
      biometricId: "BIO002",
      restaurantId: restaurant.id,
      userId: waiter2.id,
    },
  });

  const empChef1 = await prisma.employee.create({
    data: {
      name: "Rajesh Gupta",
      employeeCode: "EMP003",
      biometricId: "BIO003",
      restaurantId: restaurant.id,
      userId: chef1.id,
    },
  });

  const empChef2 = await prisma.employee.create({
    data: {
      name: "Deepak Tiwari",
      employeeCode: "EMP004",
      biometricId: "BIO004",
      restaurantId: restaurant.id,
      userId: chef2.id,
    },
  });

  const empCashier = await prisma.employee.create({
    data: {
      name: "Amit Singh",
      employeeCode: "EMP005",
      biometricId: "BIO005",
      restaurantId: restaurant.id,
      userId: cashier.id,
    },
  });
  console.log("✅ Created 5 employees");

  // 7. Create Attendance Punches (last 3 days)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 2);

  // Today's attendance
  await prisma.attendancePunch.createMany({
    data: [
      // Waiter 1
      {
        employeeId: empWaiter1.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(today.setHours(9, 0, 0)),
        source: "biometric",
      },
      {
        employeeId: empWaiter1.id,
        restaurantId: restaurant.id,
        type: PunchType.OUT,
        timestamp: new Date(today.setHours(13, 30, 0)),
        source: "biometric",
      },
      {
        employeeId: empWaiter1.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(today.setHours(14, 30, 0)),
        source: "biometric",
      },

      // Waiter 2
      {
        employeeId: empWaiter2.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(today.setHours(9, 15, 0)),
        source: "biometric",
      },

      // Chef 1
      {
        employeeId: empChef1.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(today.setHours(8, 30, 0)),
        source: "biometric",
      },
      {
        employeeId: empChef1.id,
        restaurantId: restaurant.id,
        type: PunchType.OUT,
        timestamp: new Date(today.setHours(13, 0, 0)),
        source: "biometric",
      },
      {
        employeeId: empChef1.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(today.setHours(14, 0, 0)),
        source: "biometric",
      },

      // Chef 2
      {
        employeeId: empChef2.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(today.setHours(8, 45, 0)),
        source: "biometric",
      },

      // Cashier
      {
        employeeId: empCashier.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(today.setHours(10, 0, 0)),
        source: "manual",
      },
    ],
  });

  // Yesterday's complete attendance
  await prisma.attendancePunch.createMany({
    data: [
      {
        employeeId: empWaiter1.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(yesterday.setHours(9, 0, 0)),
        source: "biometric",
      },
      {
        employeeId: empWaiter1.id,
        restaurantId: restaurant.id,
        type: PunchType.OUT,
        timestamp: new Date(yesterday.setHours(18, 0, 0)),
        source: "biometric",
      },
      {
        employeeId: empWaiter2.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(yesterday.setHours(9, 10, 0)),
        source: "biometric",
      },
      {
        employeeId: empWaiter2.id,
        restaurantId: restaurant.id,
        type: PunchType.OUT,
        timestamp: new Date(yesterday.setHours(18, 15, 0)),
        source: "biometric",
      },
      {
        employeeId: empChef1.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(yesterday.setHours(8, 30, 0)),
        source: "biometric",
      },
      {
        employeeId: empChef1.id,
        restaurantId: restaurant.id,
        type: PunchType.OUT,
        timestamp: new Date(yesterday.setHours(17, 30, 0)),
        source: "biometric",
      },
      {
        employeeId: empChef2.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(yesterday.setHours(8, 45, 0)),
        source: "biometric",
      },
      {
        employeeId: empChef2.id,
        restaurantId: restaurant.id,
        type: PunchType.OUT,
        timestamp: new Date(yesterday.setHours(17, 45, 0)),
        source: "biometric",
      },
      {
        employeeId: empCashier.id,
        restaurantId: restaurant.id,
        type: PunchType.IN,
        timestamp: new Date(yesterday.setHours(10, 0, 0)),
        source: "manual",
      },
      {
        employeeId: empCashier.id,
        restaurantId: restaurant.id,
        type: PunchType.OUT,
        timestamp: new Date(yesterday.setHours(19, 0, 0)),
        source: "manual",
      },
    ],
  });
  console.log("✅ Created attendance punches");

  // 8. Create Menu Categories
  const starters = await prisma.menuCategory.create({
    data: {
      name: "Starters & Appetizers",
      nameHindi: "शुरुआत और स्नैक्स",
      description: "Delicious starters to begin your meal",
      restaurantId: restaurant.id,
    },
  });

  const parathas = await prisma.menuCategory.create({
    data: {
      name: "Special Parathas",
      nameHindi: "विशेष पराठे",
      description: "Our signature stuffed parathas",
      restaurantId: restaurant.id,
    },
  });

  const riceBiryani = await prisma.menuCategory.create({
    data: {
      name: "Rice & Biryani",
      nameHindi: "चावल और बिरयानी",
      description: "Aromatic rice dishes and biryani",
      restaurantId: restaurant.id,
    },
  });

  const bread = await prisma.menuCategory.create({
    data: {
      name: "Breads",
      nameHindi: "रोटी और नान",
      description: "Freshly baked Indian breads",
      restaurantId: restaurant.id,
    },
  });

  const mainCourses = await prisma.menuCategory.create({
    data: {
      name: "Main Courses",
      nameHindi: "मुख्य व्यंजन",
      description: "Rich and flavorful curries",
      restaurantId: restaurant.id,
    },
  });

  const beverages = await prisma.menuCategory.create({
    data: {
      name: "Beverages",
      nameHindi: "पेय पदार्थ",
      description: "Refreshing drinks",
      restaurantId: restaurant.id,
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      name: "Desserts",
      nameHindi: "मिठाई",
      description: "Sweet treats to end your meal",
      restaurantId: restaurant.id,
    },
  });
  console.log("✅ Created 7 menu categories");

  // 9. Create Menu Items with Variants
  console.log("Creating menu items with variants...");

  // Starters
  const paneerTikka = await prisma.menuItem.create({
    data: {
      name: "Paneer Tikka",
      nameHindi: "पनीर टिक्का",
      description: "Cottage cheese marinated in spices and grilled",
      descriptionHindi: "मसालों में मैरीनेट किया हुआ और ग्रिल किया हुआ पनीर",
      categoryId: starters.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Half",
            nameHindi: "हाफ",
            price: 150,
            restaurantId: restaurant.id,
          },
          {
            name: "Full",
            nameHindi: "फुल",
            price: 250,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  const vegSamosa = await prisma.menuItem.create({
    data: {
      name: "Veg Samosa",
      nameHindi: "वेज समोसा",
      description: "Crispy pastry filled with spiced potatoes",
      descriptionHindi: "मसालेदार आलू से भरी खस्ता पेस्ट्री",
      categoryId: starters.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "2 Pcs",
          nameHindi: "2 पीस",
          price: 60,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const chickenPakora = await prisma.menuItem.create({
    data: {
      name: "Chicken Pakora",
      nameHindi: "चिकन पकोड़ा",
      description: "Spiced chicken fritters",
      descriptionHindi: "मसालेदार चिकन के पकोड़े",
      categoryId: starters.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Half",
            nameHindi: "हाफ",
            price: 120,
            restaurantId: restaurant.id,
          },
          {
            name: "Full",
            nameHindi: "फुल",
            price: 200,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  // Parathas
  const alooParatha = await prisma.menuItem.create({
    data: {
      name: "Aloo Paratha",
      nameHindi: "आलू पराठा",
      description: "Potato stuffed flatbread served with curd and pickle",
      descriptionHindi: "दही और अचार के साथ परोसा जाने वाला आलू भरा पराठा",
      categoryId: parathas.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Single",
            nameHindi: "सिंगल",
            price: 80,
            restaurantId: restaurant.id,
          },
          {
            name: "Double",
            nameHindi: "डबल",
            price: 140,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  const paneerParatha = await prisma.menuItem.create({
    data: {
      name: "Paneer Paratha",
      nameHindi: "पनीर पराठा",
      description: "Cottage cheese stuffed flatbread",
      descriptionHindi: "पनीर से भरा हुआ पराठा",
      categoryId: parathas.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Single",
            nameHindi: "सिंगल",
            price: 100,
            restaurantId: restaurant.id,
          },
          {
            name: "Double",
            nameHindi: "डबल",
            price: 180,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  const mixParatha = await prisma.menuItem.create({
    data: {
      name: "Mix Veg Paratha",
      nameHindi: "मिक्स वेज पराठा",
      description: "Mixed vegetables stuffed paratha",
      descriptionHindi: "मिली जुली सब्जियों से भरा पराठा",
      categoryId: parathas.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Single",
            nameHindi: "सिंगल",
            price: 90,
            restaurantId: restaurant.id,
          },
          {
            name: "Double",
            nameHindi: "डबल",
            price: 160,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  // Rice & Biryani
  const vegPulao = await prisma.menuItem.create({
    data: {
      name: "Veg Pulao",
      nameHindi: "वेज पुलाव",
      description: "Fragrant rice cooked with vegetables",
      descriptionHindi: "सब्जियों के साथ पकाए गए सुगंधित चावल",
      categoryId: riceBiryani.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Plate",
          nameHindi: "प्लेट",
          price: 150,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const chickenBiryani = await prisma.menuItem.create({
    data: {
      name: "Hyderabadi Chicken Biryani",
      nameHindi: "हैदराबादी चिकन बिरयानी",
      description: "Aromatic rice layered with marinated chicken",
      descriptionHindi: "मैरीनेट किए हुए चिकन के साथ सुगंधित चावल",
      categoryId: riceBiryani.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Half",
            nameHindi: "हाफ",
            price: 180,
            restaurantId: restaurant.id,
          },
          {
            name: "Full",
            nameHindi: "फुल",
            price: 280,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  const muttonBiryani = await prisma.menuItem.create({
    data: {
      name: "Mutton Dum Biryani",
      nameHindi: "मटन दम बिरयानी",
      description: "Slow-cooked mutton biryani",
      descriptionHindi: "धीमी आंच पर पकाई गई मटन बिरयानी",
      categoryId: riceBiryani.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Half",
            nameHindi: "हाफ",
            price: 220,
            restaurantId: restaurant.id,
          },
          {
            name: "Full",
            nameHindi: "फुल",
            price: 380,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  // Breads
  const butterNaan = await prisma.menuItem.create({
    data: {
      name: "Butter Naan",
      nameHindi: "बटर नान",
      description: "Soft leavened bread with butter",
      descriptionHindi: "बटर के साथ नरम खमीरी रोटी",
      categoryId: bread.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Piece",
          nameHindi: "पीस",
          price: 40,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const garlicNaan = await prisma.menuItem.create({
    data: {
      name: "Garlic Naan",
      nameHindi: "लहसुन नान",
      description: "Naan topped with garlic and coriander",
      descriptionHindi: "लहसुन और धनिया से सजी नान",
      categoryId: bread.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Piece",
          nameHindi: "पीस",
          price: 60,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const tandooriRoti = await prisma.menuItem.create({
    data: {
      name: "Tandoori Roti",
      nameHindi: "तंदूरी रोटी",
      description: "Whole wheat flatbread from tandoor",
      descriptionHindi: "तंदूर से बनी साबुत गेहूं की रोटी",
      categoryId: bread.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Piece",
          nameHindi: "पीस",
          price: 25,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  // Main Courses
  const paneerButterMasala = await prisma.menuItem.create({
    data: {
      name: "Paneer Butter Masala",
      nameHindi: "पनीर बटर मसाला",
      description: "Cottage cheese in rich tomato gravy",
      descriptionHindi: "गाढ़ी टमाटर की ग्रेवी में पनीर",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Regular",
          nameHindi: "रेगुलर",
          price: 220,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const dalTadka = await prisma.menuItem.create({
    data: {
      name: "Dal Tadka",
      nameHindi: "दाल तड़का",
      description: "Yellow lentils tempered with spices",
      descriptionHindi: "मसालों के तड़के वाली पीली दाल",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Regular",
          nameHindi: "रेगुलर",
          price: 160,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const butterChicken = await prisma.menuItem.create({
    data: {
      name: "Butter Chicken",
      nameHindi: "बटर चिकन",
      description: "Tender chicken in creamy tomato sauce",
      descriptionHindi: "क्रीमी टमाटर सॉस में नरम चिकन",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: [
          {
            name: "Half",
            nameHindi: "हाफ",
            price: 200,
            restaurantId: restaurant.id,
          },
          {
            name: "Full",
            nameHindi: "फुल",
            price: 320,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  const roganJosh = await prisma.menuItem.create({
    data: {
      name: "Rogan Josh",
      nameHindi: "रोगन जोश",
      description: "Kashmiri mutton curry",
      descriptionHindi: "कश्मीरी मटन करी",
      categoryId: mainCourses.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Regular",
          nameHindi: "रेगुलर",
          price: 360,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  // Beverages
  const sweetLassi = await prisma.menuItem.create({
    data: {
      name: "Sweet Lassi",
      nameHindi: "मीठी लस्सी",
      description: "Chilled yogurt drink",
      descriptionHindi: "ठंडा दही का पेय",
      categoryId: beverages.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Glass",
          nameHindi: "गिलास",
          price: 60,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const mangoLassi = await prisma.menuItem.create({
    data: {
      name: "Mango Lassi",
      nameHindi: "आम की लस्सी",
      description: "Yogurt drink with mango pulp",
      descriptionHindi: "आम के गूदे के साथ दही का पेय",
      categoryId: beverages.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Glass",
          nameHindi: "गिलास",
          price: 80,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const masalaChai = await prisma.menuItem.create({
    data: {
      name: "Masala Chai",
      nameHindi: "मसाला चाय",
      description: "Indian spiced tea",
      descriptionHindi: "भारतीय मसाला चाय",
      categoryId: beverages.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Cup",
          nameHindi: "कप",
          price: 30,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const softDrink = await prisma.menuItem.create({
    data: {
      name: "Soft Drink",
      nameHindi: "कोल्ड ड्रिंक",
      description: "Coke, Pepsi, Sprite, etc.",
      descriptionHindi: "कोक, पेप्सी, स्प्राइट आदि",
      categoryId: beverages.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Bottle",
          nameHindi: "बोतल",
          price: 40,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  // Desserts
  const gulabJamun = await prisma.menuItem.create({
    data: {
      name: "Gulab Jamun",
      nameHindi: "गुलाब जामुन",
      description: "Deep-fried milk balls in sugar syrup",
      descriptionHindi: "चीनी की चाशनी में तले हुए दूध के गोले",
      categoryId: desserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "2 Pcs",
          nameHindi: "2 पीस",
          price: 80,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const rasgulla = await prisma.menuItem.create({
    data: {
      name: "Rasgulla",
      nameHindi: "रसगुल्ला",
      description: "Soft cottage cheese balls in syrup",
      descriptionHindi: "चाशनी में नरम पनीर के गोले",
      categoryId: desserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "2 Pcs",
          nameHindi: "2 पीस",
          price: 80,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const kulfiFalooda = await prisma.menuItem.create({
    data: {
      name: "Kulfi Falooda",
      nameHindi: "कुल्फी फालूदा",
      description: "Traditional Indian ice cream with vermicelli",
      descriptionHindi: "सेवई के साथ पारंपरिक भारतीय आइसक्रीम",
      categoryId: desserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Glass",
          nameHindi: "गिलास",
          price: 120,
          restaurantId: restaurant.id,
        },
      },
    },
  });

  const iceCream = await prisma.menuItem.create({
    data: {
      name: "Ice Cream",
      nameHindi: "आइसक्रीम",
      description: "Vanilla, Chocolate, or Strawberry",
      descriptionHindi: "वनीला, चॉकलेट या स्ट्रॉबेरी",
      categoryId: desserts.id,
      restaurantId: restaurant.id,
      variants: {
        create: {
          name: "Scoop",
          nameHindi: "स्कूप",
          price: 100,
          restaurantId: restaurant.id,
        },
      },
    },
  });
  console.log("✅ Created 24 menu items with variants");

  // 10. Create Tables
  await prisma.table.createMany({
    data: [
      {
        tableNumber: "1",
        capacity: 4,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "2",
        capacity: 2,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "3",
        capacity: 6,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "4",
        capacity: 4,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "5",
        capacity: 8,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "6",
        capacity: 2,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "7",
        capacity: 4,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "8",
        capacity: 6,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "9",
        capacity: 2,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
      {
        tableNumber: "10",
        capacity: 4,
        status: TableStatus.Available,
        restaurantId: restaurant.id,
      },
    ],
  });

  const tables = await prisma.table.findMany({
    where: { restaurantId: restaurant.id },
  });
  console.log(`✅ Created ${tables.length} tables`);

  // 11. Create Inventory Items
  const flour = await prisma.inventoryItem.create({
    data: {
      name: "Wheat Flour (Atta)",
      unit: "kg",
      currentStock: 150,
      reorderLevel: 50,
      restaurantId: restaurant.id,
    },
  });

  const rice = await prisma.inventoryItem.create({
    data: {
      name: "Basmati Rice",
      unit: "kg",
      currentStock: 100,
      reorderLevel: 30,
      restaurantId: restaurant.id,
    },
  });

  const paneer = await prisma.inventoryItem.create({
    data: {
      name: "Paneer",
      unit: "kg",
      currentStock: 25,
      reorderLevel: 10,
      restaurantId: restaurant.id,
    },
  });

  const chicken = await prisma.inventoryItem.create({
    data: {
      name: "Chicken",
      unit: "kg",
      currentStock: 40,
      reorderLevel: 15,
      restaurantId: restaurant.id,
    },
  });

  const mutton = await prisma.inventoryItem.create({
    data: {
      name: "Mutton",
      unit: "kg",
      currentStock: 20,
      reorderLevel: 10,
      restaurantId: restaurant.id,
    },
  });

  const oil = await prisma.inventoryItem.create({
    data: {
      name: "Cooking Oil",
      unit: "liter",
      currentStock: 30,
      reorderLevel: 10,
      restaurantId: restaurant.id,
    },
  });

  const spices = await prisma.inventoryItem.create({
    data: {
      name: "Mixed Spices",
      unit: "kg",
      currentStock: 15,
      reorderLevel: 5,
      restaurantId: restaurant.id,
    },
  });

  const tomatoes = await prisma.inventoryItem.create({
    data: {
      name: "Tomatoes",
      unit: "kg",
      currentStock: 35,
      reorderLevel: 15,
      restaurantId: restaurant.id,
    },
  });

  const onions = await prisma.inventoryItem.create({
    data: {
      name: "Onions",
      unit: "kg",
      currentStock: 45,
      reorderLevel: 20,
      restaurantId: restaurant.id,
    },
  });

  const potatoes = await prisma.inventoryItem.create({
    data: {
      name: "Potatoes",
      unit: "kg",
      currentStock: 60,
      reorderLevel: 25,
      restaurantId: restaurant.id,
    },
  });

  const milk = await prisma.inventoryItem.create({
    data: {
      name: "Milk",
      unit: "liter",
      currentStock: 40,
      reorderLevel: 15,
      restaurantId: restaurant.id,
    },
  });

  const yogurt = await prisma.inventoryItem.create({
    data: {
      name: "Yogurt (Dahi)",
      unit: "liter",
      currentStock: 20,
      reorderLevel: 10,
      restaurantId: restaurant.id,
    },
  });
  console.log("✅ Created 12 inventory items");

  // 12. Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: "Fresh Farm Supplies",
      contactPerson: "Ramesh Patel",
      phone: "+91-9876500001",
      email: "ramesh@freshfarm.com",
      address: "Sector 21, Indore",
      restaurantId: restaurant.id,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Quality Meat & Poultry",
      contactPerson: "Suresh Kumar",
      phone: "+91-9876500002",
      email: "suresh@qualitymeat.com",
      address: "M.G. Road, Indore",
      restaurantId: restaurant.id,
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      name: "Grain & Spice Traders",
      contactPerson: "Vijay Sharma",
      phone: "+91-9876500003",
      email: "vijay@graintraders.com",
      address: "Palasia Square, Indore",
      restaurantId: restaurant.id,
    },
  });
  console.log("✅ Created 3 suppliers");

  // 13. Create Purchase Orders and Stock Logs
  const po1 = await prisma.purchaseOrder.create({
    data: {
      supplierId: supplier3.id,
      restaurantId: restaurant.id,
      invoiceNumber: "INV-2024-001",
      totalAmount: 12500,
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      purchaseItems: {
        create: [
          {
            inventoryItemId: flour.id,
            quantity: 50,
            unitPrice: 40,
            totalPrice: 2000,
            restaurantId: restaurant.id,
          },
          {
            inventoryItemId: rice.id,
            quantity: 50,
            unitPrice: 120,
            totalPrice: 6000,
            restaurantId: restaurant.id,
          },
          {
            inventoryItemId: spices.id,
            quantity: 10,
            unitPrice: 450,
            totalPrice: 4500,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  await prisma.stockLog.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        inventoryItemId: flour.id,
        changeType: StockChangeType.ADD,
        quantity: 50,
        remarks: "Purchase Order #INV-2024-001",
        purchaseOrderId: po1.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        inventoryItemId: rice.id,
        changeType: StockChangeType.ADD,
        quantity: 50,
        remarks: "Purchase Order #INV-2024-001",
        purchaseOrderId: po1.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        inventoryItemId: spices.id,
        changeType: StockChangeType.ADD,
        quantity: 10,
        remarks: "Purchase Order #INV-2024-001",
        purchaseOrderId: po1.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      supplierId: supplier2.id,
      restaurantId: restaurant.id,
      invoiceNumber: "INV-2024-002",
      totalAmount: 18500,
      purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      purchaseItems: {
        create: [
          {
            inventoryItemId: chicken.id,
            quantity: 30,
            unitPrice: 280,
            totalPrice: 8400,
            restaurantId: restaurant.id,
          },
          {
            inventoryItemId: mutton.id,
            quantity: 20,
            unitPrice: 505,
            totalPrice: 10100,
            restaurantId: restaurant.id,
          },
        ],
      },
    },
  });

  await prisma.stockLog.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        inventoryItemId: chicken.id,
        changeType: StockChangeType.ADD,
        quantity: 30,
        remarks: "Purchase Order #INV-2024-002",
        purchaseOrderId: po2.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        inventoryItemId: mutton.id,
        changeType: StockChangeType.ADD,
        quantity: 20,
        remarks: "Purchase Order #INV-2024-002",
        purchaseOrderId: po2.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Created 2 purchase orders with items and stock logs");

  // 14. Create some usage stock logs
  await prisma.stockLog.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        inventoryItemId: flour.id,
        changeType: StockChangeType.USAGE,
        quantity: -5,
        remarks: "Daily kitchen usage",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        inventoryItemId: rice.id,
        changeType: StockChangeType.USAGE,
        quantity: -8,
        remarks: "Biryani preparation",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        inventoryItemId: chicken.id,
        changeType: StockChangeType.USAGE,
        quantity: -12,
        remarks: "Chicken dishes",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        inventoryItemId: tomatoes.id,
        changeType: StockChangeType.WASTAGE,
        quantity: -2,
        remarks: "Spoiled vegetables",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Update inventory stocks
  await prisma.inventoryItem.update({
    where: { id: flour.id },
    data: { currentStock: 145 },
  });
  await prisma.inventoryItem.update({
    where: { id: rice.id },
    data: { currentStock: 92 },
  });
  await prisma.inventoryItem.update({
    where: { id: chicken.id },
    data: { currentStock: 28 },
  });
  await prisma.inventoryItem.update({
    where: { id: tomatoes.id },
    data: { currentStock: 33 },
  });

  console.log("✅ Created usage and wastage stock logs");

  // 15. Create Orders with Different Statuses
  console.log("Creating orders...");

  // Get all variants for easy reference
  const allVariants = await prisma.menuItemVariant.findMany({
    where: { restaurantId: restaurant.id },
    include: { menuItem: true },
  });

  const getVariantByName = (itemName: string, variantName: string) => {
    return allVariants.find(
      (v) => v.menuItem.name === itemName && v.name === variantName
    );
  };

  // COMPLETED Order 1 - Yesterday
  const order1 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[0]!.id,
      userId: waiter1.id,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      totalAmount: 750,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      orderItems: {
        create: [
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Aloo Paratha", "Double")?.id ?? null,
            quantity: 2,
            price: 140,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Sweet Lassi", "Glass")?.id ?? null,
            quantity: 2,
            price: 60,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Paneer Tikka", "Full")?.id ?? null,
            quantity: 1,
            price: 250,
            status: OrderItemStatus.SERVED,
          },
        ],
      },
      payments: {
        create: {
          restaurantId: restaurant.id,
          amount: 750,
          paymentMethod: PaymentMethod.CASH,
          status: "SUCCESS",
        },
      },
    },
  });

  // COMPLETED Order 2 - Yesterday
  const order2 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[2]!.id,
      userId: waiter2.id,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      totalAmount: 1240,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      orderItems: {
        create: [
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Hyderabadi Chicken Biryani", "Full")?.id ??
              null,
            quantity: 2,
            price: 280,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Butter Chicken", "Full")?.id ?? null,
            quantity: 1,
            price: 320,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Garlic Naan", "Piece")?.id ?? null,
            quantity: 4,
            price: 60,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Gulab Jamun", "2 Pcs")?.id ?? null,
            quantity: 1,
            price: 80,
            status: OrderItemStatus.SERVED,
          },
        ],
      },
      payments: {
        create: {
          restaurantId: restaurant.id,
          amount: 1240,
          paymentMethod: PaymentMethod.UPI,
          status: "SUCCESS",
          transactionId: "UPI123456789",
        },
      },
    },
  });

  // COMPLETED Take-away Order
  const order3 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      userId: cashier.id,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      takeAway: true,
      totalAmount: 940,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      orderItems: {
        create: [
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Mutton Dum Biryani", "Full")?.id ?? null,
            quantity: 1,
            price: 380,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Paneer Butter Masala", "Regular")?.id ?? null,
            quantity: 1,
            price: 220,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Butter Naan", "Piece")?.id ?? null,
            quantity: 6,
            price: 40,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Rasgulla", "2 Pcs")?.id ?? null,
            quantity: 1,
            price: 80,
            status: OrderItemStatus.SERVED,
          },
        ],
      },
      payments: {
        create: {
          restaurantId: restaurant.id,
          amount: 940,
          paymentMethod: PaymentMethod.CARD,
          status: "SUCCESS",
          transactionId: "CARD987654321",
        },
      },
    },
  });

  // IN_PROGRESS Order (Table 4)
  const order4 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[3]!.id,
      userId: waiter1.id,
      status: OrderStatus.IN_PROGRESS,
      paymentStatus: PaymentStatus.UNPAID,
      totalAmount: 890,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      orderItems: {
        create: [
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Paneer Paratha", "Double")?.id ?? null,
            quantity: 2,
            price: 180,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Dal Tadka", "Regular")?.id ?? null,
            quantity: 1,
            price: 160,
            status: OrderItemStatus.PREPARING,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Tandoori Roti", "Piece")?.id ?? null,
            quantity: 4,
            price: 25,
            status: OrderItemStatus.PREPARED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Mango Lassi", "Glass")?.id ?? null,
            quantity: 2,
            price: 80,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Kulfi Falooda", "Glass")?.id ?? null,
            quantity: 1,
            price: 120,
            status: OrderItemStatus.ORDERED,
          },
        ],
      },
    },
  });

  // Update Table 4 status
  await prisma.table.update({
    where: { id: tables[3]!.id },
    data: { status: TableStatus.Occupied },
  });

  // PENDING Order (Table 7)
  const order5 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[6]!.id,
      userId: waiter2.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      totalAmount: 730,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      orderItems: {
        create: [
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Veg Samosa", "2 Pcs")?.id ?? null,
            quantity: 2,
            price: 60,
            status: OrderItemStatus.ORDERED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Veg Pulao", "Plate")?.id ?? null,
            quantity: 2,
            price: 150,
            status: OrderItemStatus.ORDERED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Paneer Tikka", "Half")?.id ?? null,
            quantity: 1,
            price: 150,
            status: OrderItemStatus.ORDERED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Masala Chai", "Cup")?.id ?? null,
            quantity: 2,
            price: 30,
            status: OrderItemStatus.ORDERED,
          },
        ],
      },
    },
  });

  // Update Table 7 status
  await prisma.table.update({
    where: { id: tables[6]!.id },
    data: { status: TableStatus.Occupied },
  });

  // IN_PROGRESS Order (Table 5 - Large family)
  const order6 = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: tables[4]!.id,
      userId: waiter1.id,
      status: OrderStatus.IN_PROGRESS,
      paymentStatus: PaymentStatus.UNPAID,
      totalAmount: 2180,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      orderItems: {
        create: [
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Chicken Pakora", "Full")?.id ?? null,
            quantity: 2,
            price: 200,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Hyderabadi Chicken Biryani", "Full")?.id ??
              null,
            quantity: 3,
            price: 280,
            status: OrderItemStatus.PREPARING,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Rogan Josh", "Regular")?.id ?? null,
            quantity: 1,
            price: 360,
            status: OrderItemStatus.PREPARING,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Garlic Naan", "Piece")?.id ?? null,
            quantity: 8,
            price: 60,
            status: OrderItemStatus.PREPARED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Soft Drink", "Bottle")?.id ?? null,
            quantity: 4,
            price: 40,
            status: OrderItemStatus.SERVED,
          },
          {
            restaurantId: restaurant.id,
            menuItemVariantId:
              getVariantByName("Ice Cream", "Scoop")?.id ?? null,
            quantity: 3,
            price: 100,
            status: OrderItemStatus.ORDERED,
            note: "One chocolate, one vanilla, one strawberry",
          },
        ],
      },
    },
  });

  // Update Table 5 status
  await prisma.table.update({
    where: { id: tables[4]!.id },
    data: { status: TableStatus.Occupied },
  });

  // Table needs cleaning
  await prisma.table.update({
    where: { id: tables[1]!.id },
    data: { status: TableStatus.NeedCleaning },
  });

  console.log("✅ Created 6 orders with various statuses");

  // 16. Create Expenses
  await prisma.expense.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        description: "Electricity Bill - November",
        amount: 8500,
        expenseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        description: "Gas Cylinder Refill",
        amount: 1200,
        expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        description: "Kitchen Equipment Repair",
        amount: 3500,
        expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        description: "Cleaning Supplies",
        amount: 850,
        expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        restaurantId: restaurant.id,
        description: "Internet & Phone Bill",
        amount: 2200,
        expenseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });
  console.log("✅ Created 5 expenses");

  // 17. Create Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: "Welcome to RasoiTrack!",
        content:
          "Thank you for choosing RasoiTrack for your restaurant management needs. We're here to help you grow your business.",
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "New Feature: Biometric Attendance",
        content:
          "We've added biometric attendance tracking! Now you can easily monitor your staff attendance.",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Holiday Special Offer",
        content: "Upgrade to Pro Plan and get 20% off for the first 3 months!",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });
  console.log("✅ Created 3 announcements");

  // 18. Create AI Chat Conversation (sample)
  const conversation = await prisma.conversation.create({
    data: {
      userId: admin.id,
      restaurantId: restaurant.id,
      messages: {
        create: [
          {
            role: "USER",
            content: "What were my top selling items yesterday?",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            role: "AI",
            content:
              "Based on yesterday's orders, your top selling items were:\n1. Hyderabadi Chicken Biryani (Full) - 2 orders\n2. Aloo Paratha (Double) - 2 orders\n3. Butter Chicken (Full) - 1 order\n\nTotal revenue from these items was ₹1,240.",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            role: "USER",
            content: "How is my inventory looking?",
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
          {
            role: "AI",
            content:
              "Your inventory is in good shape! Here's a summary:\n✅ Well Stocked: Rice (92kg), Flour (145kg), Potatoes (60kg)\n⚠️ Monitor: Chicken (28kg), Paneer (25kg)\n✅ All items are above reorder levels.\n\nYou have 2 recent purchase orders totaling ₹31,000.",
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });
  console.log("✅ Created AI conversation with messages");

  console.log(
    "\n🎉 Database seeded successfully with comprehensive test data!"
  );
  console.log("\n📊 Summary:");
  console.log("  - 1 Restaurant (Vishal Paratha House)");
  console.log("  - 7 Users (all password: demo123)");
  console.log("  - 5 Employees with attendance records");
  console.log("  - 7 Menu Categories");
  console.log("  - 24 Menu Items with variants");
  console.log("  - 10 Tables (3 occupied, 1 needs cleaning)");
  console.log("  - 6 Orders (3 completed, 2 in-progress, 1 pending)");
  console.log("  - 12 Inventory Items");
  console.log("  - 3 Suppliers");
  console.log("  - 2 Purchase Orders");
  console.log("  - 5 Expenses");
  console.log("  - 3 Announcements");
  console.log("  - 1 AI Conversation");
  console.log("\n🔑 Login Credentials:");
  console.log("  Admin: admin@vishalparatha.com / demo123");
  console.log("  Manager: manager@vishalparatha.com / demo123");
  console.log("  Waiter 1: waiter1@vishalparatha.com / demo123");
  console.log("  Waiter 2: waiter2@vishalparatha.com / demo123");
  console.log("  Cashier: cashier@vishalparatha.com / demo123");
  console.log("  Chef 1: chef1@vishalparatha.com / demo123");
  console.log("  Chef 2: chef2@vishalparatha.com / demo123");
  console.log("  Super Admin: superadmin@rasoitrack.com / superadmin123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
