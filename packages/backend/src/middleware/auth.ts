import {Request, Response, NextFunction} from "express";
import {firebaseService} from "@/services/firebase";
import {logger} from "@/utils/logger";

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email?: string;
                name?: string;
            };
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: {
                    message: "No authorization token provided",
                    code: "MISSING_TOKEN",
                },
            });
            return;
        }

        const idToken = authHeader.split("Bearer ")[1];

        if (!idToken) {
            res.status(401).json({
                success: false,
                error: {
                    message: "Invalid authorization token format",
                    code: "INVALID_TOKEN_FORMAT",
                },
            });
            return;
        }

        // Verify the Firebase ID token
        const decodedToken = await firebaseService.verifyIdToken(idToken);

        // Attach user information to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
        };

        logger.info(`Authenticated user: ${decodedToken.uid}`, {
            email: decodedToken.email,
            path: req.path,
            method: req.method,
        });

        next();
    } catch (error) {
        logger.error("Authentication error:", error);

        res.status(401).json({
            success: false,
            error: {
                message: "Invalid or expired token",
                code: "INVALID_TOKEN",
            },
        });
    }
};

// Optional auth middleware for routes that can work with or without authentication
export const optionalAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const idToken = authHeader.split("Bearer ")[1];

            if (idToken) {
                try {
                    const decodedToken = await firebaseService.verifyIdToken(
                        idToken
                    );
                    req.user = {
                        uid: decodedToken.uid,
                        email: decodedToken.email,
                        name: decodedToken.name,
                    };
                } catch (error) {
                    // Token is invalid, but we continue without authentication
                    logger.warn("Invalid token in optional auth:", error);
                }
            }
        }

        next();
    } catch (error) {
        logger.error("Optional auth error:", error);
        next(); // Continue even if there's an error
    }
};
