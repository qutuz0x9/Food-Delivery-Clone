import { createHash, randomBytes, randomUUID, scryptSync } from "node:crypto";
import type { Char, Numeric, TimeString, TimestampString, Varchar } from "@prisma/orm-postgres/target/codec-types";
import { db } from "../prisma/db.js";

// Seed data for dev and staging only, never prod: the reference cities plus realistic rows in every other table that
// follow the rules in the contract (order totals, status history, one driver per order, payouts that add up, rating
// caches that match the published reviews).
//
// It only seeds an empty database (migrated, no rows yet) and refuses otherwise, so it never mixes with existing data.
// To seed again, reset the database first (`npm run docker:dev:reset`). Runs in one transaction, so a failure leaves
// the database untouched.
//
// Every demo user signs in with DEMO_PASSWORD. The hash format (scrypt$salt$hash) is a placeholder until the auth
// module picks its hashing library; reseed if that format changes.

const DEMO_PASSWORD = "Password123!";
const TAX_RATE = 0.14; // Not in the contract (no system settings table); Egypt's 14% VAT, for demo totals only.
const CURRENCY = "EGP" as Char<3>;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ---------------------------------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------------------------------

const NOW = new Date();
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// Dates are relative to when the seed runs, so the demo data always looks recent.
const ago = (days: number, minutes = 0): Date => new Date(NOW.getTime() - days * DAY - minutes * MINUTE);
const plus = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * MINUTE);
const day = (date: Date) => date.toISOString().slice(0, 10);

// Prisma 8 brands length- and precision-limited columns (VarChar(100), Numeric(10, 2), Timestamp(6), ...) so a value
// cannot skip the limit by accident. The brand exists only at compile time, so these helpers do the real check or
// formatting and then tell the type system it was done.
const varchar = <N extends number>(value: string, max: N): Varchar<N> => {
  if (value.length > max) throw new Error(`Value is ${value.length} characters, the column allows ${max}: ${value}`);
  return value as Varchar<N>;
};
const numeric = <P extends number, S extends number>(value: number, _precision: P, scale: S): Numeric<P, S> =>
  value.toFixed(scale) as Numeric<P, S>;
const ts = (date: Date) => date.toISOString() as TimestampString<6>;
const time = (value: string) => value as TimeString<6>;
const money = (cents: number) => numeric(cents / 100, 10, 2);
const coordinate = (value: number) => numeric(value, 9, 6);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hashPassword = (password: string) => {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 64).toString("hex")}`;
};

const must = <T>(value: T | undefined, what: string): T => {
  if (value === undefined) throw new Error(`Seed data refers to an unknown ${what}`);
  return value;
};

// ---------------------------------------------------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------------------------------------------------

type CityName = "Cairo" | "Giza" | "Alexandria";
type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";
type PaymentMethod = "cash" | "credit_card" | "debit_card" | "apple_pay" | "google_pay" | "wallet";
type ReviewStatus = "pending" | "published" | "hidden" | "deleted";

// The ids match the ones used in the examples in docs/api/, so what Swagger UI shows is what is in the database.
const CITIES = [
  { id: "5e2a9c14-7b3d-4f68-8a01-9c4d6e8f0b21", name: "Cairo", country: "Egypt" },
  { id: "7a4c1e92-0d5b-4b3f-9e68-1f2a3b4c5d6e", name: "Giza", country: "Egypt" },
  { id: "9b6e3d20-2f7a-4d51-8c80-3a4b5c6d7e8f", name: "Alexandria", country: "Egypt" },
] as const;

const ROLES = [
  { name: "Admin", description: "Platform administrator", claims: ["users.manage", "restaurants.approve", "drivers.approve", "orders.manage", "reviews.moderate", "payouts.manage"] },
  { name: "Customer", description: "Orders food", claims: ["orders.place", "reviews.write"] },
  { name: "Restaurant", description: "Restaurant owner", claims: ["menu.manage", "orders.fulfil", "reviews.reply"] },
  { name: "Driver", description: "Delivery driver", claims: ["deliveries.accept"] },
] as const;
type RoleName = (typeof ROLES)[number]["name"];

const ADMINS = [
  { key: "nour", firstName: "Nour", lastName: "Ibrahim", email: "nour.ibrahim@example.com", phone: "+201000000001", level: "super" },
  { key: "hassan", firstName: "Hassan", lastName: "Reda", email: "hassan.reda@example.com", phone: "+201000000002", level: "standard" },
];

const CUSTOMERS = [
  {
    key: "ahmed", firstName: "Ahmed", lastName: "Hassan", email: "ahmed.hassan@example.com", phone: "+201100000001",
    dateOfBirth: "1995-04-12", gender: "male", status: "active", emailVerified: true,
    addresses: [
      { key: "home", label: "Home", street: "12 Abbas El Akkad St, Nasr City", city: "Cairo", lat: 30.0561, lng: 31.3299, isDefault: true },
      { key: "work", label: "Work", street: "5 Tahrir Square, Downtown", city: "Cairo", lat: 30.0444, lng: 31.2357, isDefault: false },
    ],
  },
  {
    key: "mona", firstName: "Mona", lastName: "Ali", email: "mona.ali@example.com", phone: "+201100000002",
    dateOfBirth: "1998-09-03", gender: "female", status: "active", emailVerified: true,
    addresses: [{ key: "home", label: "Home", street: "33 Mesaha St, Dokki", city: "Giza", lat: 30.0385, lng: 31.2109, isDefault: true }],
  },
  {
    key: "omar", firstName: "Omar", lastName: "Khaled", email: "omar.khaled@example.com", phone: "+201100000003",
    dateOfBirth: "1990-01-25", gender: "male", status: "active", emailVerified: true,
    addresses: [{ key: "home", label: "Home", street: "14 Victor Emmanuel St, Smouha", city: "Alexandria", lat: 31.2156, lng: 29.9553, isDefault: true }],
  },
  {
    key: "sara", firstName: "Sara", lastName: "Mahmoud", email: "sara.mahmoud@example.com", phone: "+201100000004",
    dateOfBirth: null, gender: "female", status: "active", emailVerified: false,
    addresses: [{ key: "home", label: "Home", street: "9 Road 233, Maadi", city: "Cairo", lat: 29.9602, lng: 31.2569, isDefault: true }],
  },
  {
    key: "youssef", firstName: "Youssef", lastName: "Adel", email: "youssef.adel@example.com", phone: "+201100000005",
    dateOfBirth: "2001-07-30", gender: "male", status: "inactive", emailVerified: true,
    addresses: [],
  },
] as const;

type OptionDef = { name: string; required: boolean; min: number; max: number; values: [string, number][] };
type ItemDef = { name: string; description: string; price: number; prep: number; available?: boolean; options?: OptionDef[] };

const RESTAURANTS = [
  {
    key: "koshary", name: "Koshary El Tahrir", owner: { email: "owner@kosharyeltahrir.example.com", phone: "+201200000001" },
    description: "Classic Egyptian koshary and street food since 1974.", status: "approved",
    minimumOrder: 5000, deliveryFee: 1500, deliveryTime: 30,
    cuisines: ["Egyptian", "Street Food"],
    branches: [
      { key: "downtown", label: "Downtown", city: "Cairo", street: "18 Tahrir St", building: "Ground floor", lat: 30.0459, lng: 31.2394, availability: "open" },
      { key: "dokki", label: "Dokki", city: "Giza", street: "40 Tahrir St, Dokki", building: null, lat: 30.0382, lng: 31.2120, availability: "open" },
    ],
    menu: [
      {
        category: "Koshary",
        items: [
          { name: "Koshary Small", description: "Rice, lentils, pasta, chickpeas, tomato sauce and crispy onions.", price: 4500, prep: 5 },
          {
            name: "Koshary Large", description: "The full plate, for the hungry.", price: 7000, prep: 5,
            options: [{ name: "Extra toppings", required: false, min: 0, max: 2, values: [["Extra crispy onions", 500], ["Extra chickpeas", 500]] }],
          },
        ],
      },
      {
        category: "Sides",
        items: [
          { name: "Hawawshi", description: "Spiced minced meat baked in baladi bread.", price: 8500, prep: 15 },
          { name: "Rice Pudding", description: "Roz bel laban with nuts.", price: 3000, prep: 2 },
        ],
      },
      {
        category: "Drinks",
        items: [
          { name: "Pepsi", description: "330 ml can.", price: 2000, prep: 1 },
          { name: "Lemon Mint Juice", description: "Fresh lemon with mint.", price: 3500, prep: 3 },
        ],
      },
    ],
    promotions: [{ title: "Free delivery all week", type: "free_shipping", value: 0, startDaysAgo: 3, endDaysAgo: -4, active: true }],
  },
  {
    key: "burgerlab", name: "Burger Lab", owner: { email: "owner@burgerlab.example.com", phone: "+201200000002" },
    description: "Smash burgers, crispy fries and thick shakes.", status: "approved",
    minimumOrder: 10000, deliveryFee: 2500, deliveryTime: 35,
    cuisines: ["Burgers", "American", "Fast Food"],
    branches: [
      { key: "zamalek", label: "Zamalek", city: "Cairo", street: "26 July St, Zamalek", building: "Building 7", lat: 30.0626, lng: 31.2197, availability: "open" },
      { key: "smouha", label: "Smouha", city: "Alexandria", street: "Fawzy Moaz St, Smouha", building: null, lat: 31.2135, lng: 29.9442, availability: "busy" },
    ],
    menu: [
      {
        category: "Burgers",
        items: [
          {
            name: "Classic Burger", description: "Beef patty, cheddar, pickles and house sauce.", price: 15000, prep: 15,
            options: [
              { name: "Size", required: true, min: 1, max: 1, values: [["Single", 0], ["Double", 6000]] },
              { name: "Add-ons", required: false, min: 0, max: 2, values: [["Extra cheese", 1500], ["Beef bacon", 3000]] },
            ],
          },
          {
            name: "Chicken Burger", description: "Crispy fried chicken with coleslaw.", price: 14000, prep: 15,
            options: [{ name: "Size", required: true, min: 1, max: 1, values: [["Single", 0], ["Double", 5000]] }],
          },
        ],
      },
      {
        category: "Sides",
        items: [
          {
            name: "Fries", description: "Skin-on fries with sea salt.", price: 5000, prep: 8,
            options: [{ name: "Size", required: true, min: 1, max: 1, values: [["Regular", 0], ["Large", 2000]] }],
          },
          { name: "Onion Rings", description: "Beer-battered onion rings.", price: 6000, prep: 8, available: false },
        ],
      },
      {
        category: "Drinks",
        items: [
          { name: "Cola", description: "330 ml can.", price: 2500, prep: 1 },
          {
            name: "Milkshake", description: "Thick shake made with real ice cream.", price: 7000, prep: 5,
            options: [{ name: "Flavor", required: true, min: 1, max: 1, values: [["Vanilla", 0], ["Chocolate", 0], ["Strawberry", 0]] }],
          },
        ],
      },
    ],
    promotions: [
      { title: "Weekend 20% off", type: "percentage", value: 20, startDaysAgo: 2, endDaysAgo: -1, active: true },
      { title: "EGP 30 off orders over 300", type: "fixed", value: 30, startDaysAgo: 10, endDaysAgo: -20, active: true },
    ],
  },
  {
    key: "pizzaroma", name: "Pizza Roma", owner: { email: "owner@pizzaroma.example.com", phone: "+201200000003" },
    description: "Wood-fired Neapolitan pizza and fresh pasta.", status: "approved",
    minimumOrder: 12000, deliveryFee: 2000, deliveryTime: 40,
    cuisines: ["Italian", "Pizza", "Pasta"],
    branches: [
      { key: "mohandessin", label: "Mohandessin", city: "Giza", street: "Gameat El Dewal St, Mohandessin", building: "Building 55", lat: 30.0566, lng: 31.2002, availability: "open" },
    ],
    menu: [
      {
        category: "Pizza",
        items: [
          {
            name: "Margherita", description: "San Marzano tomato, mozzarella and basil.", price: 16000, prep: 15,
            options: [
              { name: "Size", required: true, min: 1, max: 1, values: [["Medium", 0], ["Large", 5000]] },
              { name: "Crust", required: false, min: 0, max: 1, values: [["Classic", 0], ["Thin", 0]] },
            ],
          },
          {
            name: "Pepperoni", description: "Beef pepperoni and mozzarella.", price: 19000, prep: 15,
            options: [{ name: "Size", required: true, min: 1, max: 1, values: [["Medium", 0], ["Large", 5000]] }],
          },
        ],
      },
      {
        category: "Pasta",
        items: [
          { name: "Penne Arrabbiata", description: "Spicy tomato sauce with garlic and chili.", price: 13000, prep: 12 },
          { name: "Fettuccine Alfredo", description: "Creamy parmesan sauce with chicken.", price: 15000, prep: 12 },
        ],
      },
      { category: "Drinks", items: [{ name: "Water", description: "600 ml bottle.", price: 1000, prep: 1 }] },
    ],
    promotions: [{ title: "10% off pasta", type: "percentage", value: 10, startDaysAgo: 40, endDaysAgo: 20, active: false }],
  },
  {
    key: "sweetcorner", name: "Sweet Corner", owner: { email: "owner@sweetcorner.example.com", phone: "+201200000004" },
    description: "Oriental and western desserts, waiting for approval.", status: "pending",
    minimumOrder: 6000, deliveryFee: 1500, deliveryTime: 30,
    cuisines: ["Desserts", "Bakery"],
    branches: [
      { key: "heliopolis", label: "Heliopolis", city: "Cairo", street: "Baghdad St, Korba", building: null, lat: 30.0911, lng: 31.3220, availability: "closed" },
    ],
    menu: [
      {
        category: "Cakes",
        items: [
          { name: "Chocolate Cake", description: "Slice of triple chocolate cake.", price: 9000, prep: 2 },
          { name: "Basbousa", description: "Semolina cake soaked in syrup.", price: 4000, prep: 2 },
        ],
      },
    ],
    promotions: [],
  },
] satisfies {
  key: string; name: string; owner: { email: string; phone: string }; description: string; status: "pending" | "approved" | "rejected";
  minimumOrder: number; deliveryFee: number; deliveryTime: number; cuisines: string[];
  branches: { key: string; label: string; city: CityName; street: string; building: string | null; lat: number; lng: number; availability: "open" | "closed" | "busy" }[];
  menu: { category: string; items: ItemDef[] }[];
  promotions: { title: string; type: "percentage" | "fixed" | "free_shipping" | "buy_one_get_one"; value: number; startDaysAgo: number; endDaysAgo: number; active: boolean }[];
}[];

const DRIVERS = [
  {
    key: "mahmoud", firstName: "Mahmoud", lastName: "Saeed", email: "mahmoud.saeed@example.com", phone: "+201500000001",
    dateOfBirth: "1993-02-14", nationalId: "29302140100111", license: "CAI-DL-100231", city: "Cairo", status: "active", availability: "available",
    vehicles: [
      { type: "motorcycle", brand: "Honda", model: "CB150", color: "Red", plate: "CAI-1234", year: 2021, active: true },
      { type: "scooter", brand: "Yamaha", model: "NMAX", color: "Black", plate: "CAI-0999", year: 2016, active: false },
    ],
    location: [30.0500, 31.2400],
  },
  {
    key: "karim", firstName: "Karim", lastName: "Fathy", email: "karim.fathy@example.com", phone: "+201500000002",
    dateOfBirth: "1997-11-02", nationalId: "29711020100222", license: "CAI-DL-100777", city: "Cairo", status: "active", availability: "offline",
    vehicles: [{ type: "scooter", brand: "Vespa", model: "Primavera", color: "White", plate: "CAI-5678", year: 2022, active: true }],
    location: [30.0626, 31.2200],
  },
  {
    key: "tarek", firstName: "Tarek", lastName: "Nabil", email: "tarek.nabil@example.com", phone: "+201500000003",
    dateOfBirth: "1988-06-19", nationalId: "28806190200333", license: "GIZ-DL-200118", city: "Giza", status: "active", availability: "available",
    vehicles: [{ type: "car", brand: "Hyundai", model: "Accent", color: "Silver", plate: "GIZ-4321", year: 2019, active: true }],
    location: [30.0400, 31.2100],
  },
  {
    key: "hany", firstName: "Hany", lastName: "Mostafa", email: "hany.mostafa@example.com", phone: "+201500000004",
    dateOfBirth: "1995-08-08", nationalId: "29508080300444", license: "ALX-DL-300542", city: "Alexandria", status: "active", availability: "busy",
    vehicles: [{ type: "motorcycle", brand: "Bajaj", model: "Pulsar 180", color: "Blue", plate: "ALX-8765", year: 2020, active: true }],
    location: [31.2140, 29.9500],
  },
  {
    key: "ali", firstName: "Ali", lastName: "Samir", email: "ali.samir@example.com", phone: "+201500000005",
    dateOfBirth: "2000-03-21", nationalId: "30003210100555", license: "CAI-DL-100990", city: "Cairo", status: "pending", availability: "offline",
    vehicles: [{ type: "bicycle", brand: "Trinx", model: "M136", color: "Green", plate: null, year: null, active: true }],
    location: null,
  },
] satisfies {
  key: string; firstName: string; lastName: string; email: string; phone: string; dateOfBirth: string; nationalId: string; license: string;
  city: CityName; status: "active" | "inactive" | "pending"; availability: "available" | "busy" | "offline" | "on_break";
  vehicles: { type: "car" | "motorcycle" | "scooter" | "bicycle" | "van" | "truck"; brand: string; model: string; color: string; plate: string | null; year: number | null; active: boolean }[];
  location: [number, number] | null;
}[];

type Line = { item: string; qty: number; options?: Record<string, string | string[]>; note?: string };
type ReviewDef = { rating: number; title?: string; comment?: string; status: ReviewStatus; images?: string[]; reply?: string };

type OrderDef = {
  customer: string;
  address: string;
  restaurant: string;
  branch: string;
  placedAt: Date;
  status: OrderStatus;
  payment: PaymentMethod;
  lines: Line[];
  driver?: string;
  offerRejectedBy?: string[];
  tip?: number;
  discountPercent?: number;
  note?: string;
  payout?: string;
  restaurantReview?: ReviewDef;
  driverReview?: ReviewDef;
};

const ORDERS: OrderDef[] = [
  {
    customer: "ahmed", address: "home", restaurant: "koshary", branch: "downtown", placedAt: ago(20, -13 * 60), status: "delivered",
    payment: "credit_card", driver: "mahmoud", tip: 1000, payout: "mahmoud-1",
    lines: [{ item: "Koshary Large", qty: 2, options: { "Extra toppings": ["Extra crispy onions"] } }, { item: "Pepsi", qty: 2 }],
    restaurantReview: { rating: 5, title: "Best koshary in town", comment: "Hot, fast and generous portions.", status: "published", reply: "Thank you Ahmed, see you again soon!" },
    driverReview: { rating: 5, comment: "Very polite and on time.", status: "published" },
  },
  {
    customer: "ahmed", address: "work", restaurant: "burgerlab", branch: "zamalek", placedAt: ago(12, -14 * 60), status: "delivered",
    payment: "cash", driver: "karim", offerRejectedBy: ["mahmoud"],
    lines: [
      { item: "Classic Burger", qty: 1, options: { Size: "Double", "Add-ons": ["Extra cheese", "Beef bacon"] }, note: "No pickles please" },
      { item: "Fries", qty: 1, options: { Size: "Large" } },
      { item: "Milkshake", qty: 1, options: { Flavor: "Chocolate" } },
    ],
    restaurantReview: { rating: 4, title: "Great burger", comment: "Burger was great, fries a bit cold.", status: "published", images: ["https://images.example.com/reviews/burger-1.jpg", "https://images.example.com/reviews/burger-2.jpg"] },
    driverReview: { rating: 4, comment: "Had to call him twice, but friendly.", status: "pending" },
  },
  {
    customer: "mona", address: "home", restaurant: "pizzaroma", branch: "mohandessin", placedAt: ago(8, -20 * 60), status: "delivered",
    payment: "wallet", driver: "tarek", discountPercent: 10, payout: "tarek-1",
    lines: [{ item: "Margherita", qty: 1, options: { Size: "Large", Crust: "Thin" } }, { item: "Fettuccine Alfredo", qty: 1 }, { item: "Water", qty: 2 }],
    restaurantReview: { rating: 3, title: "Okay", comment: "Pizza was good but arrived late.", status: "published", reply: "Sorry for the delay, Mona. We are adding a second oven this month." },
    driverReview: { rating: 5, comment: "Not his fault the kitchen was slow.", status: "published" },
  },
  {
    customer: "omar", address: "home", restaurant: "burgerlab", branch: "smouha", placedAt: ago(5, -19 * 60), status: "delivered",
    payment: "debit_card", driver: "hany",
    lines: [{ item: "Chicken Burger", qty: 2, options: { Size: "Single" } }, { item: "Cola", qty: 2 }],
    restaurantReview: { rating: 5, comment: "Crispy and juicy.", status: "pending" },
  },
  {
    customer: "ahmed", address: "home", restaurant: "koshary", branch: "downtown", placedAt: ago(2, -21 * 60), status: "delivered",
    payment: "apple_pay", driver: "mahmoud",
    lines: [{ item: "Hawawshi", qty: 1 }, { item: "Rice Pudding", qty: 2 }, { item: "Lemon Mint Juice", qty: 1 }],
  },
  {
    customer: "ahmed", address: "home", restaurant: "burgerlab", branch: "zamalek", placedAt: ago(4, -15 * 60), status: "cancelled",
    payment: "credit_card", note: "Changed my mind",
    lines: [{ item: "Classic Burger", qty: 1, options: { Size: "Single" } }],
  },
  {
    customer: "mona", address: "home", restaurant: "pizzaroma", branch: "mohandessin", placedAt: ago(3, -22 * 60), status: "rejected",
    payment: "cash",
    lines: [{ item: "Pepperoni", qty: 1, options: { Size: "Medium" } }],
  },
  {
    customer: "omar", address: "home", restaurant: "burgerlab", branch: "smouha", placedAt: ago(0, 40), status: "out_for_delivery",
    payment: "cash", driver: "hany",
    lines: [{ item: "Classic Burger", qty: 2, options: { Size: "Single", "Add-ons": ["Extra cheese"] } }, { item: "Fries", qty: 2, options: { Size: "Regular" } }],
  },
  {
    customer: "mona", address: "home", restaurant: "koshary", branch: "dokki", placedAt: ago(0, 8), status: "preparing",
    payment: "google_pay",
    lines: [{ item: "Koshary Small", qty: 3 }, { item: "Pepsi", qty: 3 }],
  },
  {
    customer: "sara", address: "home", restaurant: "koshary", branch: "downtown", placedAt: ago(0, 2), status: "pending",
    payment: "credit_card", note: "Please ring the bell twice",
    lines: [{ item: "Koshary Large", qty: 1, options: { "Extra toppings": ["Extra crispy onions", "Extra chickpeas"] } }],
  },
];

const CARTS: { customer: string; restaurant: string; lines: Line[] }[] = [
  {
    customer: "sara", restaurant: "burgerlab",
    lines: [{ item: "Classic Burger", qty: 1, options: { Size: "Double", "Add-ons": ["Extra cheese"] } }, { item: "Fries", qty: 2, options: { Size: "Large" } }],
  },
  {
    customer: "mona", restaurant: "pizzaroma",
    lines: [{ item: "Margherita", qty: 1, options: { Size: "Medium", Crust: "Classic" } }, { item: "Penne Arrabbiata", qty: 1, note: "Extra spicy" }],
  },
];

const PAYOUTS = [
  { key: "mahmoud-1", driver: "mahmoud", periodStart: ago(27), periodEnd: ago(14), status: "completed", paidAt: ago(13) },
  { key: "tarek-1", driver: "tarek", periodStart: ago(13), periodEnd: ago(1), status: "processing", paidAt: null },
] as const;

// Order of a full delivery, the minutes after placing at which each status is reached, and who makes the change.
const FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["pending"],
  accepted: ["pending", "accepted"],
  rejected: ["pending", "rejected"],
  cancelled: ["pending", "cancelled"],
  preparing: ["pending", "accepted", "preparing"],
  ready_for_pickup: ["pending", "accepted", "preparing", "ready_for_pickup"],
  picked_up: ["pending", "accepted", "preparing", "ready_for_pickup", "picked_up"],
  out_for_delivery: ["pending", "accepted", "preparing", "ready_for_pickup", "picked_up", "out_for_delivery"],
  delivered: ["pending", "accepted", "preparing", "ready_for_pickup", "picked_up", "out_for_delivery", "delivered"],
};
const STEP_MINUTES: Record<OrderStatus, number> = {
  pending: 0, cancelled: 2, accepted: 3, rejected: 4, preparing: 5, ready_for_pickup: 25, picked_up: 32, out_for_delivery: 34, delivered: 55,
};
const STATUS_TIMESTAMP = {
  accepted: "acceptedAt", rejected: "rejectedAt", preparing: "preparedAt", ready_for_pickup: "readyForPickupAt",
  picked_up: "pickedUpAt", out_for_delivery: "outForDeliveryAt", delivered: "deliveredAt", cancelled: "cancelledAt",
} as const;
const STATUS_ACTOR: Record<OrderStatus, "customer" | "restaurant" | "driver"> = {
  pending: "customer", cancelled: "customer", accepted: "restaurant", rejected: "restaurant", preparing: "restaurant",
  ready_for_pickup: "restaurant", picked_up: "driver", out_for_delivery: "driver", delivered: "driver",
};

// ---------------------------------------------------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------------------------------------------------

type MenuItemRef = {
  id: string;
  name: string;
  price: number;
  groups: Map<string, { id: string; name: string; values: Map<string, { id: string; name: string; adjustment: number }> }>;
};
type ChosenOption = { groupId: string; groupName: string; valueId: string; valueName: string; adjustment: number };

async function seed(tx: Tx) {
  // Cities ---------------------------------------------------------------------------------------------------------
  const cities = new Map<string, { id: string; name: string }>();
  for (const city of CITIES) {
    await tx.orm.public.City.create({ id: city.id, name: varchar(city.name, 100), country: varchar(city.country, 100) });
    cities.set(city.name, { id: city.id, name: city.name });
  }
  const cityOf = (name: CityName) => must(cities.get(name), `city "${name}"`);

  // Roles ----------------------------------------------------------------------------------------------------------
  const roleIds = new Map<RoleName, string>();
  for (const role of ROLES) {
    const id = randomUUID();
    await tx.orm.identity.Role.create({ id, name: role.name, normalizedName: role.name.toUpperCase(), description: role.description });
    for (const claim of role.claims) {
      await tx.orm.identity.RoleClaim.create({ id: randomUUID(), roleId: id, claimType: "permission", claimValue: claim });
    }
    roleIds.set(role.name, id);
  }

  const createUser = async (user: { email: string; phone: string; role: RoleName; status?: "active" | "inactive"; emailVerified?: boolean; createdAt: Date }) => {
    const id = randomUUID();
    await tx.orm.identity.User.create({
      id,
      email: user.email,
      normalizedEmail: user.email.toUpperCase(),
      passwordHash: hashPassword(DEMO_PASSWORD),
      phoneNumber: user.phone,
      emailVerifiedAt: user.emailVerified === false ? null : ts(plus(user.createdAt, 10)),
      phoneVerifiedAt: ts(plus(user.createdAt, 12)),
      accountStatus: user.status ?? "active",
      createdAt: ts(user.createdAt),
      updatedAt: user.status === "inactive" ? ts(ago(6)) : null,
    });
    await tx.orm.identity.UserRole.create({ userId: id, roleId: must(roleIds.get(user.role), `role ${user.role}`) });
    return id;
  };

  // Admins ---------------------------------------------------------------------------------------------------------
  const admins = new Map<string, { userId: string; email: string }>();
  for (const admin of ADMINS) {
    const userId = await createUser({ email: admin.email, phone: admin.phone, role: "Admin", createdAt: ago(120) });
    await tx.orm.public.Admin.create({ id: randomUUID(), userId, firstName: admin.firstName, lastName: admin.lastName, createdAt: ts(ago(120)) });
    await tx.orm.identity.UserClaim.create({ id: randomUUID(), userId, claimType: "admin_level", claimValue: admin.level });
    admins.set(admin.key, { userId, email: admin.email });
  }
  const superAdmin = must(admins.get("nour"), "admin nour");

  const audit = async (entry: { action: string; entityName: string; entityId: string; oldValue: unknown; newValue: unknown; at: Date }) => {
    await tx.orm.identity.AuditLog.create({
      id: randomUUID(),
      userId: superAdmin.userId,
      actorEmail: superAdmin.email,
      action: entry.action,
      entityName: entry.entityName,
      entityId: entry.entityId,
      oldValue: entry.oldValue as never,
      newValue: entry.newValue as never,
      ipAddress: "41.33.120.15",
      requestId: randomUUID(),
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0",
      status: "success",
      createdAt: ts(entry.at),
    });
  };

  // Customers and their saved addresses ----------------------------------------------------------------------------
  const customers = new Map<string, { id: string; userId: string; name: string; phone: string; addresses: Map<string, (typeof CUSTOMERS)[number]["addresses"][number]> }>();
  for (const customer of CUSTOMERS) {
    const createdAt = ago(90);
    const userId = await createUser({ email: customer.email, phone: customer.phone, role: "Customer", status: customer.status, emailVerified: customer.emailVerified, createdAt });
    const id = randomUUID();
    await tx.orm.public.Customer.create({
      id, userId, firstName: customer.firstName, lastName: customer.lastName,
      profileImageUrl: `https://images.example.com/avatars/${customer.key}.jpg`,
      dateOfBirth: customer.dateOfBirth, gender: customer.gender, createdAt: ts(createdAt),
    });
    const addresses = new Map<string, (typeof CUSTOMERS)[number]["addresses"][number]>();
    for (const address of customer.addresses) {
      addresses.set(address.key, address);
      await tx.orm.public.DeliveryAddress.create({
        id: randomUUID(), customerId: id, label: address.label, recipientName: `${customer.firstName} ${customer.lastName}`,
        phoneNumber: customer.phone, streetAddress: address.street, cityId: cityOf(address.city).id, state: null, postalCode: null,
        latitude: coordinate(address.lat), longitude: coordinate(address.lng), isDefault: address.isDefault, createdAt: ts(createdAt),
      });
    }
    customers.set(customer.key, { id, userId, name: `${customer.firstName} ${customer.lastName}`, phone: customer.phone, addresses });
    if (customer.status === "inactive") {
      await audit({ action: "user.status.update", entityName: "users", entityId: userId, oldValue: { accountStatus: "active" }, newValue: { accountStatus: "inactive" }, at: ago(6) });
    }
  }

  // Sign-in records: an external login, a pending verification code, rotated refresh tokens and a used reset link.
  const ahmed = must(customers.get("ahmed"), "customer ahmed");
  const mona = must(customers.get("mona"), "customer mona");
  const sara = must(customers.get("sara"), "customer sara");
  await tx.orm.identity.UserLogin.create({ userId: sara.userId, loginProvider: "google", name: "Google", value: "google-oauth2|104857382910475820193", createdAt: ts(ago(30)) });
  await tx.orm.identity.UserToken.create({
    userId: sara.userId, loginProvider: "verification", tokenName: "email", value: sha256("483920"), expiresAt: ts(plus(NOW, 15)), createdAt: ts(NOW),
  });
  const rotatedTokenId = randomUUID();
  const currentTokenId = randomUUID();
  await tx.orm.identity.RefreshToken.create({
    id: rotatedTokenId, userId: ahmed.userId, tokenHash: sha256(randomUUID()), expiresAt: ts(plus(ago(10), 30 * 24 * 60)), createdAt: ts(ago(10)),
    revokedAt: ts(ago(1)), replacedByToken: currentTokenId, revokedReason: "rotated", deviceId: "iphone-15-ahmed", ipAddress: "197.34.12.8",
  });
  await tx.orm.identity.RefreshToken.create({
    id: currentTokenId, userId: ahmed.userId, tokenHash: sha256(randomUUID()), expiresAt: ts(plus(ago(1), 30 * 24 * 60)), createdAt: ts(ago(1)),
    deviceId: "iphone-15-ahmed", ipAddress: "197.34.12.8",
  });
  await tx.orm.identity.RefreshToken.create({
    id: randomUUID(), userId: mona.userId, tokenHash: sha256(randomUUID()), expiresAt: ts(plus(ago(2), 30 * 24 * 60)), createdAt: ts(ago(2)),
    deviceId: "pixel-8-mona", ipAddress: "156.205.44.91",
  });
  await tx.orm.identity.PasswordResetToken.create({
    id: randomUUID(), userId: mona.userId, tokenHash: sha256(randomUUID()), expiresAt: ts(plus(ago(15), 30)), usedAt: ts(plus(ago(15), 4)),
    createdAt: ts(ago(15)), ipAddress: "156.205.44.91", deviceId: "pixel-8-mona",
  });

  // Restaurants, branches, hours, cuisines, menus, promotions ------------------------------------------------------
  const restaurants = new Map<string, {
    id: string; userId: string; deliveryFee: number;
    branches: Map<string, { id: string; city: CityName }>;
    items: Map<string, MenuItemRef>;
  }>();
  for (const restaurant of RESTAURANTS) {
    const createdAt = ago(100);
    const userId = await createUser({ email: restaurant.owner.email, phone: restaurant.owner.phone, role: "Restaurant", createdAt });
    const id = randomUUID();
    await tx.orm.public.Restaurant.create({
      id, userId, name: varchar(restaurant.name, 150), description: restaurant.description,
      logoUrl: `https://images.example.com/restaurants/${restaurant.key}/logo.png`,
      coverImageUrl: `https://images.example.com/restaurants/${restaurant.key}/cover.jpg`,
      status: restaurant.status, minimumOrderAmount: money(restaurant.minimumOrder), deliveryFee: money(restaurant.deliveryFee),
      estimatedDeliveryTime: restaurant.deliveryTime, createdAt: ts(createdAt),
    });
    if (restaurant.status === "approved") {
      await audit({ action: "restaurant.status.update", entityName: "restaurants", entityId: id, oldValue: { status: "pending" }, newValue: { status: "approved" }, at: ago(98) });
    }

    const branches = new Map<string, { id: string; city: CityName }>();
    for (const branch of restaurant.branches) {
      const branchId = randomUUID();
      await tx.orm.public.RestaurantBranch.create({
        id: branchId, restaurantId: id, cityId: cityOf(branch.city).id, label: varchar(branch.label, 100), street: branch.street, building: branch.building,
        latitude: coordinate(branch.lat), longitude: coordinate(branch.lng), availabilityStatus: branch.availability, createdAt: ts(createdAt),
      });
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        // Pizza Roma closes on Mondays; Fridays open late everywhere else.
        const isClosed = restaurant.key === "pizzaroma" && dayOfWeek === 1;
        await tx.orm.public.RestaurantOperatingHour.create({
          id: randomUUID(), branchId, dayOfWeek, isClosed,
          opensAt: isClosed ? null : time(dayOfWeek === 5 ? "13:00:00" : "10:00:00"),
          closesAt: isClosed ? null : time("23:30:00"),
          createdAt: ts(createdAt),
        });
      }
      branches.set(branch.key, { id: branchId, city: branch.city });
    }

    for (const cuisine of restaurant.cuisines) {
      await tx.orm.public.RestaurantCategory.create({ id: randomUUID(), restaurantId: id, name: varchar(cuisine, 150), createdAt: ts(createdAt) });
    }

    const items = new Map<string, MenuItemRef>();
    for (const [index, section] of restaurant.menu.entries()) {
      const categoryId = randomUUID();
      await tx.orm.public.MenuCategory.create({ id: categoryId, restaurantId: id, name: varchar(section.category, 100), displayOrder: index + 1, createdAt: ts(createdAt) });
      for (const item of section.items as ItemDef[]) {
        const itemId = randomUUID();
        await tx.orm.public.MenuItem.create({
          id: itemId, restaurantId: id, categoryId, name: varchar(item.name, 150), description: item.description, basePrice: money(item.price),
          isAvailable: item.available ?? true, preparationTime: item.prep, createdAt: ts(createdAt), updatedAt: ts(createdAt),
        });
        const slug = item.name.toLowerCase().replaceAll(" ", "-");
        for (let order = 0; order < 2; order++) {
          await tx.orm.public.MenuItemImage.create({
            id: randomUUID(), menuItemId: itemId, imageUrl: `https://images.example.com/restaurants/${restaurant.key}/menu/${slug}-${order + 1}.jpg`, displayOrder: order,
          });
        }
        const groups: MenuItemRef["groups"] = new Map();
        for (const option of item.options ?? []) {
          const groupId = randomUUID();
          await tx.orm.public.MenuItemOptionGroup.create({
            id: groupId, menuItemId: itemId, name: option.name, minSelection: option.min, maxSelection: option.max, isRequired: option.required,
          });
          const values = new Map<string, { id: string; name: string; adjustment: number }>();
          for (const [position, [valueName, adjustment]] of option.values.entries()) {
            const valueId = randomUUID();
            await tx.orm.public.MenuItemOptionValue.create({
              id: valueId, optionGroupId: groupId, name: valueName, priceAdjustment: money(adjustment), displayOrder: position,
            });
            values.set(valueName, { id: valueId, name: valueName, adjustment });
          }
          groups.set(option.name, { id: groupId, name: option.name, values });
        }
        items.set(item.name, { id: itemId, name: item.name, price: item.price, groups });
      }
    }

    for (const promotion of restaurant.promotions) {
      await tx.orm.public.RestaurantPromotion.create({
        id: randomUUID(), restaurantId: id, title: promotion.title, discountType: promotion.type, discountValue: money(promotion.value * 100),
        startsAt: ts(ago(promotion.startDaysAgo)), endsAt: ts(ago(promotion.endDaysAgo)), isActive: promotion.active, createdAt: ts(ago(promotion.startDaysAgo + 1)),
      });
    }

    restaurants.set(restaurant.key, { id, userId, deliveryFee: restaurant.deliveryFee, branches, items });
  }

  // Drivers, vehicles, documents, live location --------------------------------------------------------------------
  const drivers = new Map<string, { id: string; userId: string; city: CityName; status: string }>();
  for (const driver of DRIVERS) {
    const createdAt = ago(80);
    const userId = await createUser({ email: driver.email, phone: driver.phone, role: "Driver", createdAt });
    const id = randomUUID();
    await tx.orm.public.Driver.create({
      id, userId, firstName: varchar(driver.firstName, 100), lastName: varchar(driver.lastName, 100), dateOfBirth: driver.dateOfBirth,
      profileImageUrl: `https://images.example.com/drivers/${driver.key}.jpg`, nationalId: varchar(driver.nationalId, 30), licenseNumber: varchar(driver.license, 50),
      licenseExpiryDate: day(ago(-700)), workingCityId: cityOf(driver.city).id, status: driver.status, availabilityStatus: driver.availability,
      createdAt: ts(createdAt), updatedAt: ts(createdAt),
    });
    for (const vehicle of driver.vehicles) {
      await tx.orm.public.DriverVehicle.create({
        id: randomUUID(), driverId: id, vehicleType: vehicle.type, brand: varchar(vehicle.brand, 100), model: varchar(vehicle.model, 100), color: varchar(vehicle.color, 50),
        plateNumber: vehicle.plate ? varchar(vehicle.plate, 30) : null, manufactureYear: vehicle.year, insuranceExpiryDate: vehicle.plate ? day(ago(-200)) : null,
        isActive: vehicle.active, createdAt: ts(vehicle.active ? createdAt : ago(400)),
      });
    }
    const verified = driver.status === "active";
    const documents: { type: "driver_license" | "national_id" | "vehicle_registration" | "insurance"; expiry: Date | null; status: "submitted" | "verified" | "expired" }[] = [
      { type: "national_id", expiry: ago(-1500), status: verified ? "verified" : "submitted" },
      { type: "driver_license", expiry: ago(-700), status: verified ? "verified" : "submitted" },
    ];
    if (driver.vehicles.some((vehicle) => vehicle.plate)) documents.push({ type: "vehicle_registration", expiry: ago(-300), status: "verified" });
    if (driver.key === "karim") documents.push({ type: "insurance", expiry: ago(10), status: "expired" });
    for (const document of documents) {
      await tx.orm.public.DriverDocument.create({
        id: randomUUID(), driverId: id, documentType: document.type, fileUrl: `https://files.example.com/drivers/${driver.key}/${document.type}.pdf`,
        status: document.status, expiryDate: document.expiry ? day(document.expiry) : null,
        verifiedAt: document.status === "submitted" ? null : ts(ago(78)), createdAt: ts(ago(79)),
      });
    }
    if (driver.location) {
      // A short trail of pings, newest last.
      for (let ping = 3; ping >= 1; ping--) {
        await tx.orm.public.DriverLocation.create({
          driverId: id, latitude: coordinate(driver.location[0] + ping * 0.0012), longitude: coordinate(driver.location[1] - ping * 0.0009),
          heading: 135, speed: numeric(driver.availability === "offline" ? 0 : 24.5, 5, 2), recordedAt: ts(ago(0, ping)),
        });
      }
    }
    if (verified) {
      await audit({ action: "driver.status.update", entityName: "drivers", entityId: id, oldValue: { status: "pending" }, newValue: { status: "active" }, at: ago(78) });
    }
    drivers.set(driver.key, { id, userId, city: driver.city, status: driver.status });
  }

  const payouts = new Map<string, { id: string; driverId: string; status: (typeof PAYOUTS)[number]["status"]; total: number }>();
  for (const payout of PAYOUTS) {
    const id = randomUUID();
    const driverId = must(drivers.get(payout.driver), `driver ${payout.driver}`).id;
    await tx.orm.public.DriverPayout.create({
      id, driverId, periodStart: day(payout.periodStart), periodEnd: day(payout.periodEnd), amount: money(0), status: payout.status,
      paidAt: payout.paidAt ? ts(payout.paidAt) : null,
    });
    payouts.set(payout.key, { id, driverId, status: payout.status, total: 0 });
  }

  // Resolve a cart/order line into prices and the chosen option values.
  const priceLine = (items: Map<string, MenuItemRef>, line: Line) => {
    const item = must(items.get(line.item), `menu item "${line.item}"`);
    const chosen: ChosenOption[] = [];
    for (const [groupName, picked] of Object.entries(line.options ?? {})) {
      const group = must(item.groups.get(groupName), `option group "${groupName}" on "${item.name}"`);
      for (const valueName of Array.isArray(picked) ? picked : [picked]) {
        const value = must(group.values.get(valueName), `option "${valueName}" in "${groupName}"`);
        chosen.push({ groupId: group.id, groupName: group.name, valueId: value.id, valueName: value.name, adjustment: value.adjustment });
      }
    }
    const unitPrice = item.price + chosen.reduce((sum, option) => sum + option.adjustment, 0);
    return { item, chosen, unitPrice, totalPrice: unitPrice * line.qty };
  };

  // Carts ----------------------------------------------------------------------------------------------------------
  for (const cart of CARTS) {
    const restaurant = must(restaurants.get(cart.restaurant), `restaurant ${cart.restaurant}`);
    const lines = cart.lines.map((line) => ({ line, ...priceLine(restaurant.items, line) }));
    const cartId = randomUUID();
    await tx.orm.public.ShoppingCart.create({
      id: cartId, customerId: must(customers.get(cart.customer), `customer ${cart.customer}`).id, restaurantId: restaurant.id,
      subtotal: money(lines.reduce((sum, line) => sum + line.totalPrice, 0)), createdAt: ts(ago(0, 30)), updatedAt: ts(ago(0, 5)),
    });
    for (const { line, item, chosen, unitPrice, totalPrice } of lines) {
      const cartItemId = randomUUID();
      await tx.orm.public.ShoppingCartItem.create({
        id: cartItemId, shoppingCartId: cartId, menuItemId: item.id, quantity: line.qty, unitPrice: money(unitPrice), totalPrice: money(totalPrice),
        specialInstructions: line.note ?? null,
      });
      for (const option of chosen) {
        await tx.orm.public.ShoppingCartItemOption.create({
          id: randomUUID(), shoppingCartItemId: cartItemId, optionGroupId: option.groupId, optionValueId: option.valueId, createdAt: ts(ago(0, 30)),
        });
      }
    }
  }

  // Orders: snapshot, lines, status history, payment, dispatch, earnings, reviews -----------------------------------
  const restaurantRatings = new Map<string, number[]>();
  const driverRatings = new Map<string, number[]>();
  const completedDeliveries = new Map<string, number>();

  for (const [index, order] of ORDERS.entries()) {
    const customer = must(customers.get(order.customer), `customer ${order.customer}`);
    const address = must(customer.addresses.get(order.address), `address ${order.address} of ${order.customer}`);
    const restaurant = must(restaurants.get(order.restaurant), `restaurant ${order.restaurant}`);
    const branch = must(restaurant.branches.get(order.branch), `branch ${order.branch}`);
    const driver = order.driver ? must(drivers.get(order.driver), `driver ${order.driver}`) : undefined;
    if (branch.city !== address.city) throw new Error(`Order ${index + 1}: branch and delivery address are in different cities`);
    if (driver && driver.city !== branch.city) throw new Error(`Order ${index + 1}: driver does not work in the branch's city`);

    const lines = order.lines.map((line) => ({ line, ...priceLine(restaurant.items, line) }));
    const subtotal = lines.reduce((sum, line) => sum + line.totalPrice, 0);
    const discount = Math.round((subtotal * (order.discountPercent ?? 0)) / 100);
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + restaurant.deliveryFee + tax - discount;

    const steps = FLOW[order.status];
    const at = (status: OrderStatus) => plus(order.placedAt, STEP_MINUTES[status]);
    const timestamps: Partial<Record<(typeof STATUS_TIMESTAMP)[keyof typeof STATUS_TIMESTAMP], TimestampString<6>>> = {};
    for (const status of steps) if (status !== "pending") timestamps[STATUS_TIMESTAMP[status]] = ts(at(status));
    const last = at(order.status);

    const snapshotId = randomUUID();
    await tx.orm.public.DeliveryAddressSnapshot.create({
      id: snapshotId, customerId: customer.id, label: address.label, recipientName: customer.name, phoneNumber: customer.phone,
      streetAddress: address.street, cityId: cityOf(address.city).id, city: address.city, state: null, postalCode: null,
      latitude: coordinate(address.lat), longitude: coordinate(address.lng), isDefault: address.isDefault, createdAt: ts(order.placedAt),
    });

    const orderId = randomUUID();
    await tx.orm.public.Order.create({
      id: orderId, orderNumber: `ORD-${1001 + index}`, customerId: customer.id, restaurantId: restaurant.id, restaurantBranchId: branch.id,
      deliveryAddressId: snapshotId, status: order.status, subtotal: money(subtotal), deliveryFee: money(restaurant.deliveryFee),
      taxAmount: money(tax), discountAmount: money(discount), totalAmount: money(total), customerNote: order.note ?? null,
      placedAt: ts(order.placedAt), ...timestamps, createdAt: ts(order.placedAt), updatedAt: ts(last),
    });

    for (const { line, item, chosen, unitPrice, totalPrice } of lines) {
      const orderItemId = randomUUID();
      await tx.orm.public.OrderItem.create({
        id: orderItemId, orderId, menuItemId: item.id, quantity: line.qty, unitPrice: money(unitPrice), totalPrice: money(totalPrice),
        specialInstructions: line.note ?? null,
      });
      for (const option of chosen) {
        await tx.orm.public.OrderItemOption.create({
          id: randomUUID(), orderItemId, optionGroupId: option.groupId, optionValueId: option.valueId, optionGroupName: option.groupName,
          optionValueName: option.valueName, priceAdjustment: money(option.adjustment), createdAt: ts(order.placedAt),
        });
      }
    }

    const actorUser = { customer: customer.userId, restaurant: restaurant.userId, driver: driver?.userId ?? customer.userId };
    for (const status of steps) {
      await tx.orm.public.OrderStatusHistory.create({
        id: randomUUID(), orderId, status, changedByUserId: actorUser[STATUS_ACTOR[status]], changedAt: ts(at(status)),
        note: status === "rejected" ? "Kitchen closed early" : status === "cancelled" ? (order.note ?? null) : null,
      });
    }

    // Payment: online methods are charged when the order is placed; cash is collected by the driver on delivery.
    const paymentId = randomUUID();
    const isCash = order.payment === "cash";
    const endedEarly = order.status === "cancelled" || order.status === "rejected";
    const paymentStatus =
      isCash ? (order.status === "delivered" ? "paid" : endedEarly ? "failed" : "pending")
      : order.status === "pending" ? "processing"
      : endedEarly ? "refunded"
      : "paid";
    const paidAt = isCash ? (order.status === "delivered" ? at("out_for_delivery") : null) : order.status === "pending" ? null : plus(order.placedAt, 1);
    await tx.orm.public.Payment.create({
      id: paymentId, orderId, paymentMethod: order.payment, status: paymentStatus,
      transactionReference: isCash || paymentStatus === "processing" ? null : `txn_${randomBytes(8).toString("hex")}`,
      amount: money(total), currency: CURRENCY, paidAt: paidAt ? ts(paidAt) : null,
      failureReason: paymentStatus === "failed" ? `Order ${order.status} before delivery` : null,
      createdAt: ts(order.placedAt), updatedAt: ts(last),
    });
    if (paymentStatus === "refunded") {
      await tx.orm.public.PaymentRefund.create({
        id: randomUUID(), paymentId, amount: money(total), reason: `Order ${order.status}`, status: "completed",
        processedAt: ts(plus(last, 1)), createdAt: ts(last),
      });
    }

    // Dispatch: once accepted, every active driver in the branch's city gets an offer; the first to accept wins.
    if (steps.includes("accepted")) {
      const offeredAt = at("accepted");
      const winner = order.driver;
      for (const [key, candidate] of drivers) {
        if (candidate.status !== "active" || candidate.city !== branch.city) continue;
        const rejected = order.offerRejectedBy?.includes(key) ?? false;
        const status = key === winner ? "accepted" : rejected ? "rejected" : winner ? "withdrawn" : "offered";
        await tx.orm.public.DeliveryOffer.create({
          id: randomUUID(), orderId, driverId: candidate.id, status, offeredAt: ts(offeredAt), expiresAt: ts(plus(offeredAt, 10)),
          respondedAt: status === "accepted" ? ts(plus(offeredAt, 2)) : status === "rejected" ? ts(plus(offeredAt, 1)) : null,
        });
      }
    }

    if (driver) {
      const assignmentId = randomUUID();
      const delivered = order.status === "delivered";
      await tx.orm.public.DriverAssignment.create({
        id: assignmentId, orderId, driverId: driver.id, status: delivered ? "completed" : "accepted",
        assignedAt: ts(plus(at("accepted"), 2)), acceptedAt: ts(plus(at("accepted"), 2)), completedAt: delivered ? ts(at("delivered")) : null,
      });
      if (delivered) {
        completedDeliveries.set(order.driver!, (completedDeliveries.get(order.driver!) ?? 0) + 1);
        const payout = order.payout ? must(payouts.get(order.payout), `payout ${order.payout}`) : undefined;
        const baseFee = 2500;
        const bonus = subtotal > 30000 ? 500 : 0;
        const tip = order.tip ?? 0;
        const net = baseFee + bonus + tip;
        if (payout) payout.total += net;
        await tx.orm.public.Earning.create({
          id: randomUUID(), driverId: driver.id, orderId, driverAssignmentId: assignmentId, driverPayoutId: payout?.id ?? null,
          baseFee: money(baseFee), bonus: money(bonus), tip: money(tip), deduction: money(0), netAmount: money(net),
          status: payout?.status ?? "pending", createdAt: ts(at("delivered")),
        });
      }
    }

    // Reviews are only written for delivered orders.
    if (order.restaurantReview) {
      const review = order.restaurantReview;
      const reviewId = randomUUID();
      const reviewedAt = plus(last, 90);
      await tx.orm.public.RestaurantReview.create({
        id: reviewId, customerId: customer.id, restaurantId: restaurant.id, orderId, rating: review.rating, title: review.title ?? null,
        comment: review.comment ?? null, status: review.status, createdAt: ts(reviewedAt), updatedAt: ts(reviewedAt),
        publishedAt: review.status === "published" ? ts(plus(reviewedAt, 60)) : null,
      });
      for (const [position, imageUrl] of (review.images ?? []).entries()) {
        await tx.orm.public.RestaurantReviewImage.create({ id: randomUUID(), reviewId, imageUrl, sortOrder: position, uploadedAt: ts(reviewedAt) });
      }
      if (review.reply) {
        await tx.orm.public.RestaurantReviewReply.create({
          id: randomUUID(), reviewId, restaurantId: restaurant.id, reply: review.reply, createdAt: ts(plus(reviewedAt, 240)), updatedAt: ts(plus(reviewedAt, 240)),
        });
      }
      if (review.status === "published") {
        restaurantRatings.set(order.restaurant, [...(restaurantRatings.get(order.restaurant) ?? []), review.rating]);
        await audit({ action: "review.status.update", entityName: "restaurant_reviews", entityId: reviewId, oldValue: { status: "pending" }, newValue: { status: "published" }, at: plus(reviewedAt, 60) });
      }
    }
    if (order.driverReview && driver) {
      const review = order.driverReview;
      const reviewedAt = plus(last, 95);
      await tx.orm.public.DriverReview.create({
        id: randomUUID(), customerId: customer.id, driverId: driver.id, orderId, rating: review.rating, title: review.title ?? null,
        comment: review.comment ?? null, status: review.status, createdAt: ts(reviewedAt), updatedAt: ts(reviewedAt),
        publishedAt: review.status === "published" ? ts(plus(reviewedAt, 60)) : null,
      });
      if (review.status === "published") driverRatings.set(order.driver!, [...(driverRatings.get(order.driver!) ?? []), review.rating]);
    }
  }

  // Cached totals: payout amounts, rating averages and delivery counts must match the rows above.
  for (const payout of payouts.values()) {
    await tx.orm.public.DriverPayout.where({ id: payout.id }).update({ amount: money(payout.total) });
  }
  const average = (ratings: number[]) => numeric(ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0, 3, 2);
  for (const [key, restaurant] of restaurants) {
    const ratings = restaurantRatings.get(key) ?? [];
    await tx.orm.public.Restaurant.where({ id: restaurant.id }).update({ ratingAverage: average(ratings), ratingCount: ratings.length });
  }
  for (const [key, driver] of drivers) {
    await tx.orm.public.Driver.where({ id: driver.id }).update({ rating: average(driverRatings.get(key) ?? []), totalDeliveries: completedDeliveries.get(key) ?? 0 });
  }
}

// Users and cities are the roots every other row hangs off, so if both are empty nothing else can exist yet.
const hasData = (await db.orm.identity.User.first()) !== null || (await db.orm.public.City.first()) !== null;
if (hasData) {
  console.error("The database already has data. Seeding only runs on an empty database: reset it first (npm run docker:<env>:reset).");
  process.exitCode = 1;
} else {
  await db.transaction(seed);
  console.log(
    `Seeded ${CITIES.length} cities, ${ADMINS.length} admins, ${CUSTOMERS.length} customers, ${RESTAURANTS.length} restaurants, ${DRIVERS.length} drivers, ${ORDERS.length} orders, ${CARTS.length} carts.`,
  );
  console.log(`Every seeded user signs in with the password: ${DEMO_PASSWORD}`);
}

await db.close();
