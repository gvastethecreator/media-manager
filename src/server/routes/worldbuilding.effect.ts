/**
 * @file Worldbuilding route facade (transitional compatibility)
 * @module server/routes/worldbuilding.effect
 * @description Facade temporal hacia módulos por capacidad.
 * @deprecated Usar `places.effect`, `concepts.effect`, `prompts.effect` directamente.
 */

import conceptsEffectRouter, { conceptsRouter } from './concepts.effect';
import placesEffectRouter, { placesRouter } from './places.effect';
import promptsEffectRouter, { promptsRouter } from './prompts.effect';

export { placesRouter, conceptsRouter, promptsRouter };
export { placesEffectRouter, conceptsEffectRouter, promptsEffectRouter };
export default placesEffectRouter;
