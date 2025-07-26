import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Router } from 'express';

export type ExpressHandler = RequestHandler;

export const createTypedRouter = (): Router => {
	return Router();
};

export type { Request, Response, NextFunction };
