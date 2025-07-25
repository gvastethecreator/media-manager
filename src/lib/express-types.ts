import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

export type ExpressHandler = (req: Request, res: Response, next?: NextFunction) => Promise<any> | any;

export const createTypedRouter = (): Router => {
	return Router();
};

export type { Request, Response, NextFunction };
