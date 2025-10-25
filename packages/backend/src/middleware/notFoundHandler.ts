import {Request, Response, NextFunction} from "express";

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.url} not found`,
            code: "ROUTE_NOT_FOUND",
        },
        timestamp: new Date().toISOString(),
        path: req.url,
    });
};
