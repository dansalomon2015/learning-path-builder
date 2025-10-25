import {Router} from "express";
import {learningPathRoutes} from "./learningPath";
import {userRoutes} from "./user";

const router = Router();

// Mount route modules
router.use("/learning-paths", learningPathRoutes);
router.use("/users", userRoutes);

// API info endpoint
router.get("/", (req, res) => {
    res.json({
        message: "Learning Path Builder API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: {
            learningPaths: "/api/learning-paths",
            users: "/api/users",
            health: "/health",
        },
    });
});

export default router;
