import { dateScenarioSchema } from "../../domain/game";
import { alternateExDoubleDate } from "./alternate-ex-double-date";
import { memoryCourseDinner } from "./memory-course-dinner";
import { museumExhibitMixup } from "./museum-exhibit-mixup";
import { prophecyKaraoke } from "./prophecy-karaoke";
import { temporalCoffeeShop } from "./temporal-coffee-shop";
import { underworldDepartmentMixer } from "./underworld-department-mixer";

export const starterScenarios = dateScenarioSchema
  .array()
  .length(6)
  .parse([
    temporalCoffeeShop,
    museumExhibitMixup,
    alternateExDoubleDate,
    memoryCourseDinner,
    prophecyKaraoke,
    underworldDepartmentMixer,
  ]);

export {
  alternateExDoubleDate,
  memoryCourseDinner,
  museumExhibitMixup,
  prophecyKaraoke,
  temporalCoffeeShop,
  underworldDepartmentMixer,
};
