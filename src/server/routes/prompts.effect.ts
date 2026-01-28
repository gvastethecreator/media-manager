/**
 * @file Express Routes para Prompts usando Effect
 * @module server/routes/prompts.effect
 * @description Rutas REST para Prompts implementadas con Effect-TS
 */

import express from 'express';

const router = express.Router();

export { default as promptsEffectRouter } from './worldbuilding.effect';
