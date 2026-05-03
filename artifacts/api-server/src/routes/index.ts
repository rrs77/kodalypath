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

export default router;
