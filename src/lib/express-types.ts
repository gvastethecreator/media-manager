import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

export type ExpressHandler = (req: Request, res: Response, next?: NextFunction) => Promise<any> | any;

export const createTypedRouter = (): Router => {
  return Router();
};

export { Request, Response, NextFunction };
