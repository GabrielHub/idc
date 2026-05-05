import { dateScenarioSchema } from "../../domain/game";
import { alternateExDoubleDate } from "./alternate-ex-double-date";
import { bowlingLeagueNight } from "./bowling-league-night";
import { chainRestaurantTuesday } from "./chain-restaurant-tuesday";
import { couchNightTakeout } from "./couch-night-takeout";
import { countyFairFriday } from "./county-fair-friday";
import { cousinsWeddingPlusOne } from "./cousins-wedding-plus-one";
import { dinerElevenPm } from "./diner-eleven-pm";
import { dmvNumberTicket } from "./dmv-number-ticket";
import { groceryRunOneDinner } from "./grocery-run-one-dinner";
import { hardwareStoreOneProject } from "./hardware-store-one-project";
import { hotelBarLastCall } from "./hotel-bar-last-call";
import { mallFoodCourtWeeknight } from "./mall-food-court-weeknight";
import { memoryCourseDinner } from "./memory-course-dinner";
import { museumExhibitMixup } from "./museum-exhibit-mixup";
import { openHouseSunday } from "./open-house-sunday";
import { parkLoopWithADog } from "./park-loop-with-a-dog";
import { potteryStudioDropIn } from "./pottery-studio-drop-in";
import { prophecyKaraoke } from "./prophecy-karaoke";
import { temporalCoffeeShop } from "./temporal-coffee-shop";
import { underworldDepartmentMixer } from "./underworld-department-mixer";

export const starterScenarios = dateScenarioSchema
  .array()
  .length(20)
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
    openHouseSunday,
    hardwareStoreOneProject,
    hotelBarLastCall,
    countyFairFriday,
    potteryStudioDropIn,
    dmvNumberTicket,
  ]);

export {
  alternateExDoubleDate,
  bowlingLeagueNight,
  chainRestaurantTuesday,
  couchNightTakeout,
  countyFairFriday,
  cousinsWeddingPlusOne,
  dinerElevenPm,
  dmvNumberTicket,
  groceryRunOneDinner,
  hardwareStoreOneProject,
  hotelBarLastCall,
  mallFoodCourtWeeknight,
  memoryCourseDinner,
  museumExhibitMixup,
  openHouseSunday,
  parkLoopWithADog,
  potteryStudioDropIn,
  prophecyKaraoke,
  temporalCoffeeShop,
  underworldDepartmentMixer,
};
