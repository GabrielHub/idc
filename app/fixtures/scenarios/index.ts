import { dateScenarioSchema } from "../../domain/game";
import { adventurersSpeakeasy } from "./adventurers-speakeasy";
import { bowlingLeagueNight } from "./bowling-league-night";
import { capitalShipWarDinner } from "./capital-ship-war-dinner";
import { chainRestaurantTuesday } from "./chain-restaurant-tuesday";
import { cloudCastleMiniGolf } from "./cloud-castle-mini-golf";
import { concessionStandHeatDeath } from "./concession-stand-heat-death";
import { couchNightTakeout } from "./couch-night-takeout";
import { countyFairFriday } from "./county-fair-friday";
import { cousinsWeddingPlusOne } from "./cousins-wedding-plus-one";
import { dinerElevenPm } from "./diner-eleven-pm";
import { dinosaurBbqAllYouCanEat } from "./dinosaur-bbq-all-you-can-eat";
import { dmvNumberTicket } from "./dmv-number-ticket";
import { driveInLastReel } from "./drive-in-last-reel";
import { executiveLunchOneAgendaItem } from "./executive-lunch-one-agenda-item";
import { groceryRunOneDinner } from "./grocery-run-one-dinner";
import { hardwareStoreOneProject } from "./hardware-store-one-project";
import { hotelBarLastCall } from "./hotel-bar-last-call";
import { impossibleLostAndFound } from "./impossible-lost-and-found";
import { listeningBoothAfterClose } from "./listening-booth-after-close";
import { mallFoodCourtWeeknight } from "./mall-food-court-weeknight";
import { memoryCourseDinner } from "./memory-course-dinner";
import { messHallAuriga } from "./mess-hall-auriga";
import { midnightNotaryTwoCleanPromises } from "./midnight-notary-two-clean-promises";
import { moonPicnic } from "./moon-picnic";
import { museumExhibitMixup } from "./museum-exhibit-mixup";
import { olympusBottomlessBrunch } from "./olympus-bottomless-brunch";
import { openHouseSunday } from "./open-house-sunday";
import { parkLoopWithADog } from "./park-loop-with-a-dog";
import { phantomDoorbellSuite } from "./phantom-doorbell-suite";
import { pilgrimageMercySpine } from "./pilgrimage-mercy-spine";
import { potteryStudioDropIn } from "./pottery-studio-drop-in";
import { prophecyKaraoke } from "./prophecy-karaoke";
import { softLaunchPhotoWall } from "./soft-launch-photo-wall";
import { temporalCoffeeShop } from "./temporal-coffee-shop";
import { underworldDepartmentMixer } from "./underworld-department-mixer";
import { vivariumWingTinyResidents } from "./vivarium-wing-tiny-residents";
import { volcanoHotSpring } from "./volcano-hot-spring";
import { whaleConcertBelowWorld } from "./whale-concert-below-world";
import { worldSimOperatorBooth } from "./world-sim-operator-booth";

export const starterScenarios = dateScenarioSchema
  .array()
  .length(39)
  .parse([
    temporalCoffeeShop,
    museumExhibitMixup,
    phantomDoorbellSuite,
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
    driveInLastReel,
    messHallAuriga,
    pilgrimageMercySpine,
    whaleConcertBelowWorld,
    concessionStandHeatDeath,
    vivariumWingTinyResidents,
    worldSimOperatorBooth,
    moonPicnic,
    cloudCastleMiniGolf,
    olympusBottomlessBrunch,
    volcanoHotSpring,
    adventurersSpeakeasy,
    capitalShipWarDinner,
    dinosaurBbqAllYouCanEat,
  ]);

export {
  adventurersSpeakeasy,
  bowlingLeagueNight,
  capitalShipWarDinner,
  chainRestaurantTuesday,
  cloudCastleMiniGolf,
  concessionStandHeatDeath,
  couchNightTakeout,
  countyFairFriday,
  cousinsWeddingPlusOne,
  dinerElevenPm,
  dinosaurBbqAllYouCanEat,
  dmvNumberTicket,
  driveInLastReel,
  executiveLunchOneAgendaItem,
  groceryRunOneDinner,
  hardwareStoreOneProject,
  hotelBarLastCall,
  impossibleLostAndFound,
  listeningBoothAfterClose,
  mallFoodCourtWeeknight,
  memoryCourseDinner,
  messHallAuriga,
  midnightNotaryTwoCleanPromises,
  moonPicnic,
  museumExhibitMixup,
  olympusBottomlessBrunch,
  openHouseSunday,
  parkLoopWithADog,
  phantomDoorbellSuite,
  pilgrimageMercySpine,
  potteryStudioDropIn,
  prophecyKaraoke,
  softLaunchPhotoWall,
  temporalCoffeeShop,
  underworldDepartmentMixer,
  vivariumWingTinyResidents,
  volcanoHotSpring,
  whaleConcertBelowWorld,
  worldSimOperatorBooth,
};
