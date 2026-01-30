/**
 * @file Express Routes para Concepts usando Effect
 * @module server/routes/concepts.effect
 * @description Rutas REST para Concepts implementadas con Effect-TS
 */

import express from 'express';

const router = express.Router();

export { default as conceptsEffectRouter } from './worldbuilding.effect';
