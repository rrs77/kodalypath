import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import pathwayRouter from "./pathway";
import activitiesRouter from "./activities";
import classesRouter from "./classes";
import lessonsRouter from "./lessons";
import calendarRouter from "./calendar";
import resourcesRouter from "./resources";
import curriculumRouter from "./curriculum";
import adminRouter from "./admin";
import pagesRouter from "./pages";
import microcopyRouter from "./microcopy";
import navRouter from "./nav";
import mediaRouter from "./media";
import storageRouter from "./storage";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(pathwayRouter);
router.use(activitiesRouter);
router.use(classesRouter);
router.use(lessonsRouter);
router.use(calendarRouter);
router.use(resourcesRouter);
router.use(curriculumRouter);
router.use(adminRouter);
router.use(pagesRouter);
router.use(microcopyRouter);
router.use(navRouter);
router.use(mediaRouter);

// Storage: presigning is admin-only (only admins can upload to the media
// library). Object-serve routes (`/storage/objects/*`, `/storage/public-objects/*`)
// stay public so any visitor can render images.
router.use("/storage/uploads/request-url", requireAdmin);
router.use(storageRouter);

export default router;
