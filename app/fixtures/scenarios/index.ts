import { dateScenarioSchema } from "../../domain/game";
import { alternateExDoubleDate } from "./alternate-ex-double-date";
import { bowlingLeagueNight } from "./bowling-league-night";
import { chainRestaurantTuesday } from "./chain-restaurant-tuesday";
import { couchNightTakeout } from "./couch-night-takeout";
import { countyFairFriday } from "./county-fair-friday";
import { cousinsWeddingPlusOne } from "./cousins-wedding-plus-one";
import { dinerElevenPm } from "./diner-eleven-pm";
import { dmvNumberTicket } from "./dmv-number-ticket";
import { executiveLunchOneAgendaItem } from "./executive-lunch-one-agenda-item";
import { groceryRunOneDinner } from "./grocery-run-one-dinner";
import { hardwareStoreOneProject } from "./hardware-store-one-project";
import { hotelBarLastCall } from "./hotel-bar-last-call";
import { impossibleLostAndFound } from "./impossible-lost-and-found";
import { listeningBoothAfterClose } from "./listening-booth-after-close";
import { mallFoodCourtWeeknight } from "./mall-food-court-weeknight";
import { memoryCourseDinner } from "./memory-course-dinner";
import { midnightNotaryTwoCleanPromises } from "./midnight-notary-two-clean-promises";
import { museumExhibitMixup } from "./museum-exhibit-mixup";
import { openHouseSunday } from "./open-house-sunday";
import { parkLoopWithADog } from "./park-loop-with-a-dog";
import { potteryStudioDropIn } from "./pottery-studio-drop-in";
import { prophecyKaraoke } from "./prophecy-karaoke";
import { softLaunchPhotoWall } from "./soft-launch-photo-wall";
import { temporalCoffeeShop } from "./temporal-coffee-shop";
import { underworldDepartmentMixer } from "./underworld-department-mixer";

export const starterScenarios = dateScenarioSchema
  .array()
  .length(25)
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
    executiveLunchOneAgendaItem,
    listeningBoothAfterClose,
    midnightNotaryTwoCleanPromises,
    softLaunchPhotoWall,
    impossibleLostAndFound,
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
  executiveLunchOneAgendaItem,
  groceryRunOneDinner,
  hardwareStoreOneProject,
  hotelBarLastCall,
  impossibleLostAndFound,
  listeningBoothAfterClose,
  mallFoodCourtWeeknight,
  memoryCourseDinner,
  midnightNotaryTwoCleanPromises,
  museumExhibitMixup,
  openHouseSunday,
  parkLoopWithADog,
  potteryStudioDropIn,
  prophecyKaraoke,
  softLaunchPhotoWall,
  temporalCoffeeShop,
  underworldDepartmentMixer,
};
