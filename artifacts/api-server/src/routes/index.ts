import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import cleanersRouter from "./cleaners";
import propertiesRouter from "./properties";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import trustRouter from "./trust";
import availabilityRouter from "./availability";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(cleanersRouter);
router.use(propertiesRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(trustRouter);
router.use(availabilityRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
