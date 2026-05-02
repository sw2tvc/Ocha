import { db } from "@workspace/db";
import { usersTable, cleanersTable, propertiesTable, notificationsTable, bookingsTable, disputesTable, messagesTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { logger } from "./logger";

export async function seedDemoData() {
  try {
    const existingCleaners = await db.execute(sql`SELECT COUNT(*) as count FROM cleaners`);
    const count = Number((existingCleaners.rows[0] as any).count);
    if (count > 0) return;

    logger.info("Seeding demo data...");

    await db.insert(usersTable).values([
      {
        id: "user-cleaner-1",
        email: "amara@example.com",
        fullName: "Amara Osei",
        phone: "+44 7700 900456",
        avatarUrl: "https://i.pravatar.cc/150?img=32",
        role: "cleaner",
        isVerified: true,
        verificationBadge: "trusted",
        trustScore: 96,
      },
      {
        id: "user-cleaner-2",
        email: "james@example.com",
        fullName: "James Adeyemi",
        phone: "+44 7700 900789",
        avatarUrl: "https://i.pravatar.cc/150?img=68",
        role: "cleaner",
        isVerified: true,
        verificationBadge: "verified",
        trustScore: 91,
      },
      {
        id: "user-cleaner-3",
        email: "nadia@example.com",
        fullName: "Nadia Kowalski",
        phone: "+44 7700 900321",
        avatarUrl: "https://i.pravatar.cc/150?img=56",
        role: "cleaner",
        isVerified: true,
        verificationBadge: "trusted",
        trustScore: 98,
      },
      {
        id: "user-cleaner-4",
        email: "marcus@example.com",
        fullName: "Marcus Thompson",
        phone: "+44 7700 900654",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        role: "cleaner",
        isVerified: true,
        verificationBadge: "verified",
        trustScore: 88,
      },
    ]).onConflictDoNothing();

    await db.insert(cleanersTable).values([
      {
        id: "cleaner-1",
        userId: "user-cleaner-1",
        bio: "5 years of professional cleaning experience. Specialising in Airbnb turnovers and deep cleans. Attention to detail is my signature.",
        serviceTypes: ["standard", "deep_clean", "airbnb_turnover"],
        hourlyRate: 22,
        isAvailable: true,
        isVerified: true,
        verificationBadge: "trusted",
        trustScore: 96,
        repeatBookingRate: 84,
        completionRate: 99,
        responseTime: "< 15 min",
        totalBookings: 412,
        averageRating: 4.9,
        reviewCount: 203,
        wouldWorkAgainPct: 97,
        cancellationRate: 1,
        serviceRadius: 8,
        locationLat: 51.515,
        locationLng: -0.09,
      },
      {
        id: "cleaner-2",
        userId: "user-cleaner-2",
        bio: "Reliable, professional and thorough. End of tenancy specialist with 7 years experience.",
        serviceTypes: ["standard", "end_of_tenancy", "office"],
        hourlyRate: 20,
        isAvailable: true,
        isVerified: true,
        verificationBadge: "verified",
        trustScore: 91,
        repeatBookingRate: 76,
        completionRate: 97,
        responseTime: "< 30 min",
        totalBookings: 287,
        averageRating: 4.8,
        reviewCount: 142,
        wouldWorkAgainPct: 93,
        cancellationRate: 3,
        serviceRadius: 12,
        locationLat: 51.52,
        locationLng: -0.08,
      },
      {
        id: "cleaner-3",
        userId: "user-cleaner-3",
        bio: "Methodical and meticulous. My clients book me for years, not once.",
        serviceTypes: ["standard", "deep_clean", "recurring"],
        hourlyRate: 24,
        isAvailable: false,
        isVerified: true,
        verificationBadge: "trusted",
        trustScore: 98,
        repeatBookingRate: 91,
        completionRate: 100,
        responseTime: "< 1 hr",
        totalBookings: 634,
        averageRating: 5.0,
        reviewCount: 318,
        wouldWorkAgainPct: 99,
        cancellationRate: 0,
        serviceRadius: 6,
        locationLat: 51.51,
        locationLng: -0.12,
      },
      {
        id: "cleaner-4",
        userId: "user-cleaner-4",
        bio: "Focused on property management clients. I handle everything from regular cleans to emergency turnovers.",
        serviceTypes: ["standard", "airbnb_turnover", "office"],
        hourlyRate: 21,
        isAvailable: true,
        isVerified: true,
        verificationBadge: "verified",
        trustScore: 88,
        repeatBookingRate: 68,
        completionRate: 95,
        responseTime: "< 1 hr",
        totalBookings: 198,
        averageRating: 4.7,
        reviewCount: 89,
        wouldWorkAgainPct: 88,
        cancellationRate: 5,
        serviceRadius: 15,
        locationLat: 51.505,
        locationLng: -0.07,
      },
    ]).onConflictDoNothing();

    await db.insert(usersTable).values({
      id: "user-demo-1",
      email: "sarah@example.com",
      fullName: "Sarah Mitchell",
      phone: "+44 7700 900123",
      avatarUrl: "https://i.pravatar.cc/150?img=47",
      role: "customer",
      isVerified: true,
      verificationBadge: "verified",
      trustScore: 87,
    }).onConflictDoNothing();

    await db.insert(propertiesTable).values([
      {
        id: "prop-1",
        ownerId: "user-demo-1",
        name: "Shoreditch Studio",
        propertyType: "airbnb",
        addressLine1: "14 Curtain Road",
        city: "London",
        postcode: "EC2A 3NZ",
        accessNotes: "Key in lockbox code 4521. Lift to 3rd floor.",
        parkingInfo: "No parking. Nearest paid parking on Old Street.",
        hasLift: true,
        petsInfo: "No pets",
        cleaningFrequency: "weekly",
        bedroomCount: 1,
        bathroomCount: 1,
        sqft: 520,
      },
      {
        id: "prop-2",
        ownerId: "user-demo-1",
        name: "Hackney Family Home",
        propertyType: "house",
        addressLine1: "8 Queensbridge Road",
        city: "London",
        postcode: "E8 3NH",
        accessNotes: "Front door key under the mat. Alarm code: 7890.",
        parkingInfo: "Free parking on street after 6pm.",
        hasLift: false,
        petsInfo: "1 cat — very friendly",
        cleaningFrequency: "biweekly",
        bedroomCount: 3,
        bathroomCount: 2,
        sqft: 1200,
      },
    ]).onConflictDoNothing();

    logger.info("Demo data seeded successfully.");
  } catch (err) {
    logger.error({ err }, "Failed to seed demo data");
  }
}

export async function seedNotifications() {
  try {
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, "user-demo-1"))
      .limit(1);
    if (existing.length > 0) return;

    const now = Date.now();
    await db.insert(notificationsTable).values([
      {
        id: "notif-1",
        userId: "user-demo-1",
        type: "review_revealed",
        title: "Reviews are live!",
        message: "Your review of James Adeyemi and his review of you have both been revealed.",
        isRead: false,
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        createdAt: new Date(now - 10 * 60000),
      },
      {
        id: "notif-2",
        userId: "user-demo-1",
        type: "booking_completed",
        title: "Cleaning complete",
        message: "James Adeyemi finished cleaning Hackney Family Home. Hope it went brilliantly!",
        isRead: false,
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        createdAt: new Date(now - 2 * 3600000),
      },
      {
        id: "notif-3",
        userId: "user-demo-1",
        type: "booking_en_route",
        title: "James is on his way",
        message: "James Adeyemi is en route to Hackney Family Home. ETA ~15 min.",
        isRead: true,
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        createdAt: new Date(now - 5 * 3600000),
      },
      {
        id: "notif-4",
        userId: "user-demo-1",
        type: "booking_accepted",
        title: "Booking confirmed",
        message: "James Adeyemi accepted your booking for Hackney Family Home on 20 Apr.",
        isRead: true,
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        createdAt: new Date(now - 13 * 86400000),
      },
      {
        id: "notif-5",
        userId: "user-demo-1",
        type: "trust_update",
        title: "Trust score updated",
        message: "Your Ocha trust score is now 87. Consistent bookings and reviews keep it growing.",
        isRead: true,
        bookingId: null,
        createdAt: new Date(now - 14 * 86400000),
      },
      {
        id: "notif-6",
        userId: "user-demo-1",
        type: "booking_accepted",
        title: "Booking cancelled",
        message: "Your booking with Amara Osei for Shoreditch Studio was cancelled.",
        isRead: true,
        bookingId: "115c1ea2-6466-4b07-84cb-335674323332",
        createdAt: new Date(now - 15 * 86400000),
      },
    ]).onConflictDoNothing();

    logger.info("Notifications seeded.");
  } catch (err) {
    logger.error({ err }, "Failed to seed notifications");
  }
}

export async function seedMessages() {
  try {
    const existing = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, "msg-seed-1"))
      .limit(1);
    if (existing.length > 0) return;

    const base = Date.now() - 13 * 86400000; /* ~13 days ago — same booking window */
    await db.insert(messagesTable).values([
      /* James → Sarah (cleaner confirmed) */
      {
        id: "msg-seed-1",
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        senderId: "user-cleaner-2",
        recipientId: "user-demo-1",
        content: "Hi Sarah! Just confirming I'll be there at 9am on Saturday for the deep clean at Hackney. Anything you'd like me to focus on?",
        isRead: true,
        createdAt: new Date(base),
      },
      /* Sarah → James */
      {
        id: "msg-seed-2",
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        senderId: "user-demo-1",
        recipientId: "user-cleaner-2",
        content: "Hi James! Yes — the oven and the bathroom tiles are the priority. The kids have been grubby all week 😅 Thank you for checking in!",
        isRead: true,
        createdAt: new Date(base + 15 * 60000),
      },
      /* James → Sarah */
      {
        id: "msg-seed-3",
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        senderId: "user-cleaner-2",
        recipientId: "user-demo-1",
        content: "Perfect, I'll bring the proper oven cleaner and limescale remover. See you Saturday!",
        isRead: true,
        createdAt: new Date(base + 20 * 60000),
      },
      /* Day of booking — Sarah → James (day-of check-in) */
      {
        id: "msg-seed-4",
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        senderId: "user-demo-1",
        recipientId: "user-cleaner-2",
        content: "Morning James! Spare key is under the blue pot outside the front door. I'll be back around 1pm. Let me know if you need anything.",
        isRead: true,
        createdAt: new Date(base + 7 * 86400000 + 8 * 3600000),
      },
      /* James → Sarah (done) */
      {
        id: "msg-seed-5",
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        senderId: "user-cleaner-2",
        recipientId: "user-demo-1",
        content: "All done! Oven is sparkling, tiles look great. Left the key back under the pot. Hope you're happy with it — was a pleasure! ✨",
        isRead: true,
        createdAt: new Date(base + 7 * 86400000 + 13 * 3600000),
      },
      /* Sarah → James (reply) */
      {
        id: "msg-seed-6",
        bookingId: "dc4ffc62-db75-42b7-8bfd-a8378a11e2d3",
        senderId: "user-demo-1",
        recipientId: "user-cleaner-2",
        content: "James this looks amazing, thank you!! The oven hasn't been this clean in years 😍",
        isRead: true,
        createdAt: new Date(base + 7 * 86400000 + 13 * 3600000 + 5 * 60000),
      },
      /* Disputed booking — Sarah's opening message */
      {
        id: "msg-seed-7",
        bookingId: "booking-disputed-1",
        senderId: "user-demo-1",
        recipientId: "user-cleaner-2",
        content: "Hi James, I've just got home and the oven and bathroom tiles haven't been touched. I thought we agreed those were priorities?",
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 86400000 + 14 * 3600000),
      },
      /* James → Sarah (disputed booking) */
      {
        id: "msg-seed-8",
        bookingId: "booking-disputed-1",
        senderId: "user-cleaner-2",
        recipientId: "user-demo-1",
        content: "Hi Sarah, I spent 2 hours there and cleaned what I could. The oven needed specialist products I didn't have. I'm sorry it didn't meet expectations.",
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 86400000 + 15 * 3600000),
      },
    ]).onConflictDoNothing();

    logger.info("Demo messages seeded.");
  } catch (err) {
    logger.error({ err }, "Failed to seed messages");
  }
}

export async function seedDisputedBooking() {
  try {
    const existing = await db
      .select()
      .from(disputesTable)
      .where(eq(disputesTable.id, "dispute-demo-1"))
      .limit(1);
    if (existing.length > 0) return;

    /* Create a disputed booking */
    const scheduledAt = new Date(Date.now() - 3 * 86400000); /* 3 days ago */
    await db.insert(bookingsTable).values({
      id: "booking-disputed-1",
      customerId: "user-demo-1",
      cleanerId: "cleaner-2",
      propertyId: "prop-2",
      serviceType: "deep_clean",
      status: "disputed",
      scheduledAt,
      estimatedDurationHours: 4,
      totalPrice: 96,
      urgency: "standard",
      notes: "Please pay particular attention to the oven and bathroom tiles.",
      reviewStatus: "pending",
    }).onConflictDoNothing();

    /* Create the dispute record */
    await db.insert(disputesTable).values({
      id: "dispute-demo-1",
      bookingId: "booking-disputed-1",
      raisedBy: "user-demo-1",
      againstUserId: "user-cleaner-2",
      reason: "incomplete_clean",
      description: "The cleaner left after 2 hours despite booking a 4-hour deep clean. The oven was not cleaned, the bathroom tiles still have limescale, and the kitchen worktops were wiped but not properly disinfected. I have photos and WhatsApp messages confirming the agreed scope.",
      raisedByEvidence: "I arrived home at 3pm to find the cleaner had already left. The oven was visibly untouched — still had burnt grease on the racks. Bathroom tiles still had significant limescale. I paid for a 4-hour deep clean and received what felt like a 2-hour standard clean.",
      againstUserEvidence: null,
      status: "evidence_submitted",
      resolution: null,
      resolvedAt: null,
    }).onConflictDoNothing();

    logger.info("Disputed booking + dispute seeded.");
  } catch (err) {
    logger.error({ err }, "Failed to seed disputed booking");
  }
}

export async function seedAvailability() {
  try {
    const { cleanerAvailabilityTable } = await import("@workspace/db");
    const now = new Date();
    const yr = now.getFullYear();
    const mo = now.getMonth() + 1;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = (d: number) => `${yr}-${pad(mo)}-${pad(d)}`;

    /* Build a realistic blocked schedule for cleaner-1 (Amara) */
    const blockedDates = [
      /* Weekend days — block a few non-weekend days too */
      { date: dateStr(8), reason: "holiday" },
      { date: dateStr(9), reason: "holiday" },
      { date: dateStr(15), reason: "personal" },
      { date: dateStr(22), reason: "fully_booked" },
      { date: dateStr(23), reason: "fully_booked" },
      /* Next month same cleaner */
      { date: `${yr}-${pad(mo === 12 ? 1 : mo + 1)}-03`, reason: "holiday" },
      { date: `${yr}-${pad(mo === 12 ? 1 : mo + 1)}-04`, reason: "holiday" },
      { date: `${yr}-${pad(mo === 12 ? 1 : mo + 1)}-05`, reason: "holiday" },
    ].filter((d) => {
      /* Don't block past dates or today */
      return new Date(d.date) > now;
    });

    for (const { date, reason } of blockedDates) {
      const id = `avail-cleaner-1-${date}`;
      await db
        .insert(cleanerAvailabilityTable)
        .values({ id, cleanerId: "cleaner-1", date, isBlocked: true, reason })
        .onConflictDoNothing();
    }

    /* A couple of blocks for cleaner-2 (James) */
    const jamesBlocked = [
      { date: dateStr(12), reason: "personal" },
      { date: dateStr(19), reason: "holiday" },
      { date: dateStr(20), reason: "holiday" },
    ].filter((d) => new Date(d.date) > now);

    for (const { date, reason } of jamesBlocked) {
      const id = `avail-cleaner-2-${date}`;
      await db
        .insert(cleanerAvailabilityTable)
        .values({ id, cleanerId: "cleaner-2", date, isBlocked: true, reason })
        .onConflictDoNothing();
    }

    logger.info("Availability seed complete.");
  } catch (err) {
    logger.error({ err }, "Failed to seed availability");
  }
}

export async function seedAcceptedBooking() {
  try {
    const existing = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, "booking-accepted-1"))
      .limit(1);
    if (existing.length > 0) return;

    /* Scheduled 2 hours from now — so it appears in "today" for Amara */
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await db.insert(bookingsTable).values({
      id: "booking-accepted-1",
      customerId: "user-demo-1",
      cleanerId: "cleaner-1",
      propertyId: "prop-1",
      serviceType: "standard",
      status: "accepted",
      scheduledAt,
      estimatedDurationHours: 2,
      totalPrice: 48,
      urgency: "standard",
      notes: "Key is under the mat. Please bring your own products if possible.",
      reviewStatus: "pending",
    }).onConflictDoNothing();

    logger.info("Accepted demo booking seeded for Amara.");
  } catch (err) {
    logger.error({ err }, "Failed to seed accepted booking");
  }
}

export async function seedEnRouteBooking() {
  try {
    const existing = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, "booking-enroute-1"))
      .limit(1);
    if (existing.length > 0) return;

    /* scheduled ~40 min from now so ETA looks live */
    const scheduledAt = new Date(Date.now() + 40 * 60000);

    await db.insert(bookingsTable).values({
      id: "booking-enroute-1",
      customerId: "user-demo-1",
      cleanerId: "cleaner-3",
      propertyId: "prop-1",
      serviceType: "deep_clean",
      status: "en_route",
      scheduledAt,
      estimatedDurationHours: 3,
      totalPrice: 72,
      urgency: "standard",
      notes: "Please focus on the bathroom and kitchen today.",
      reviewStatus: "pending",
    }).onConflictDoNothing();

    logger.info("En-route demo booking seeded.");
  } catch (err) {
    logger.error({ err }, "Failed to seed en-route booking");
  }
}
