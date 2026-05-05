import { dateScenarioSchema } from "../../domain/game";
import { alternateExDoubleDate } from "./alternate-ex-double-date";
import { bowlingLeagueNight } from "./bowling-league-night";
import { chainRestaurantTuesday } from "./chain-restaurant-tuesday";
import { couchNightTakeout } from "./couch-night-takeout";
import { cousinsWeddingPlusOne } from "./cousins-wedding-plus-one";
import { dinerElevenPm } from "./diner-eleven-pm";
import { groceryRunOneDinner } from "./grocery-run-one-dinner";
import { mallFoodCourtWeeknight } from "./mall-food-court-weeknight";
import { memoryCourseDinner } from "./memory-course-dinner";
import { museumExhibitMixup } from "./museum-exhibit-mixup";
import { parkLoopWithADog } from "./park-loop-with-a-dog";
import { prophecyKaraoke } from "./prophecy-karaoke";
import { temporalCoffeeShop } from "./temporal-coffee-shop";
import { underworldDepartmentMixer } from "./underworld-department-mixer";

export const starterScenarios = dateScenarioSchema
  .array()
  .length(14)
  .parse([
    temporalCoffeeShop,
    museumExhibitMixup,
    alternateExDoubleDate,
    memoryCourseDinner,
    prophecyKaraoke,
    underworldDepartmentMixer,
    chainRestaurantTuesday,
    couchNightTakeout,
    mallFoodCourtWeeknight,
    parkLoopWithADog,
    bowlingLeagueNight,
    groceryRunOneDinner,
    dinerElevenPm,
    cousinsWeddingPlusOne,
  ]);

export {
  alternateExDoubleDate,
  bowlingLeagueNight,
  chainRestaurantTuesday,
  couchNightTakeout,
  cousinsWeddingPlusOne,
  dinerElevenPm,
  groceryRunOneDinner,
  mallFoodCourtWeeknight,
  memoryCourseDinner,
  museumExhibitMixup,
  parkLoopWithADog,
  prophecyKaraoke,
  temporalCoffeeShop,
  underworldDepartmentMixer,
};
