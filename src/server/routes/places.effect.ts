/**
 * @file Express Routes para Places usando Effect
 * @module server/routes/places.effect
 * @description Rutas REST para Places implementadas con Effect-TS
 */

import express from 'express';

const router = express.Router();

export { conceptsRouter, default as placesEffectRouter, promptsRouter } from './worldbuilding.effect';
