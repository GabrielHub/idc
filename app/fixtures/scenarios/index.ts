import { dateScenarioSchema } from "../../domain/game";
import { aStarIsBorn } from "./a-star-is-born";
import { adventurersSpeakeasy } from "./adventurers-speakeasy";
import { allHat } from "./all-hat";
import { aquariumOfCryptids } from "./aquarium-of-cryptids";
import { auroraLinePrivateCompartment } from "./aurora-line-private-compartment";
import { bankHeist1920sEscapeRoom } from "./bank-heist-1920s-escape-room";
import { beachWhereSeaIsAbove } from "./beach-where-sea-is-above";
import { birdsArentReal } from "./birds-arent-real";
import { bowlingLeagueNight } from "./bowling-league-night";
import { brickByBrick } from "./brick-by-brick";
import { bringYourOwnBoo } from "./bring-your-own-boo";
import { buildABearEmptyMall } from "./build-a-bear-empty-mall";
import { cableCarAcrossBiomes } from "./cable-car-across-biomes";
import { capitalShipWarDinner } from "./capital-ship-war-dinner";
import { chainRestaurantTuesday } from "./chain-restaurant-tuesday";
import { chickenJockey } from "./chicken-jockey";
import { cloudCastleMiniGolf } from "./cloud-castle-mini-golf";
import { colosseumBoxFour } from "./colosseum-box-four";
import { concessionStandHeatDeath } from "./concession-stand-heat-death";
import { couchNightTakeout } from "./couch-night-takeout";
import { countyFairFriday } from "./county-fair-friday";
import { cousinsWeddingPlusOne } from "./cousins-wedding-plus-one";
import { dimSumAndThenSome } from "./dim-sum-and-then-some";
import { dinerElevenPm } from "./diner-eleven-pm";
import { dinosaurBbqAllYouCanEat } from "./dinosaur-bbq-all-you-can-eat";
import { dmvNumberTicket } from "./dmv-number-ticket";
import { driveInLastReel } from "./drive-in-last-reel";
import { emptyRoomManyWindows } from "./empty-room-many-windows";
import { executiveLunchOneAgendaItem } from "./executive-lunch-one-agenda-item";
import { groceryRunOneDinner } from "./grocery-run-one-dinner";
import { hardwareStoreOneProject } from "./hardware-store-one-project";
import { hawkerFloorSixBranches } from "./hawker-floor-six-branches";
import { hedgeWitchTeaHour } from "./hedge-witch-tea-hour";
import { hephaestusForge } from "./hephaestus-forge";
import { hotelBarLastCall } from "./hotel-bar-last-call";
import { howToTrainYourWagon } from "./how-to-train-your-wagon";
import { impossibleLostAndFound } from "./impossible-lost-and-found";
import { infiniteLibrary } from "./infinite-library";
import { itWasCheeseAllAlong } from "./it-was-cheese-all-along";
import { listeningBoothAfterClose } from "./listening-booth-after-close";
import { longAfternoonPoolBar } from "./long-afternoon-pool-bar";
import { mallFoodCourtWeeknight } from "./mall-food-court-weeknight";
import { memoryCourseDinner } from "./memory-course-dinner";
import { messHallAuriga } from "./mess-hall-auriga";
import { midnightNotaryTwoCleanPromises } from "./midnight-notary-two-clean-promises";
import { moonPicnic } from "./moon-picnic";
import { moonglassKilnAfterHours } from "./moonglass-kiln-after-hours";
import { museumExhibitMixup } from "./museum-exhibit-mixup";
import { notTheBees } from "./not-the-bees";
import { olympusBottomlessBrunch } from "./olympus-bottomless-brunch";
import { openHouseSunday } from "./open-house-sunday";
import { parkLoopWithADog } from "./park-loop-with-a-dog";
import { phantomDoorbellSuite } from "./phantom-doorbell-suite";
import { picnicOnBifrost } from "./picnic-on-bifrost";
import { picnicOnSleepingGiant } from "./picnic-on-sleeping-giant";
import { pilgrimageMercySpine } from "./pilgrimage-mercy-spine";
import { potteryStudioDropIn } from "./pottery-studio-drop-in";
import { prophecyKaraoke } from "./prophecy-karaoke";
import { pulseCheck } from "./pulse-check";
import { rookToE4 } from "./rook-to-e4";
import { softLaunchPhotoWall } from "./soft-launch-photo-wall";
import { soulCycle } from "./soul-cycle";
import { tapWater } from "./tap-water";
import { temporalCoffeeShop } from "./temporal-coffee-shop";
import { thePeanutGallery } from "./the-peanut-gallery";
import { throwingTheMatch } from "./throwing-the-match";
import { underworldDepartmentMixer } from "./underworld-department-mixer";
import { vivariumWingTinyResidents } from "./vivarium-wing-tiny-residents";
import { volcanoHotSpring } from "./volcano-hot-spring";
import { wetMarketThreeSeas } from "./wet-market-three-seas";
import { wetPaint } from "./wet-paint";
import { whaleConcertBelowWorld } from "./whale-concert-below-world";
import { worldSimOperatorBooth } from "./world-sim-operator-booth";

export const starterScenarios = dateScenarioSchema
  .array()
  .length(73)
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
    emptyRoomManyWindows,
    cableCarAcrossBiomes,
    longAfternoonPoolBar,
    hephaestusForge,
    bankHeist1920sEscapeRoom,
    buildABearEmptyMall,
    colosseumBoxFour,
    moonglassKilnAfterHours,
    aquariumOfCryptids,
    wetMarketThreeSeas,
    beachWhereSeaIsAbove,
    hawkerFloorSixBranches,
    picnicOnSleepingGiant,
    auroraLinePrivateCompartment,
    picnicOnBifrost,
    hedgeWitchTeaHour,
    dimSumAndThenSome,
    allHat,
    tapWater,
    wetPaint,
    pulseCheck,
    notTheBees,
    rookToE4,
    brickByBrick,
    itWasCheeseAllAlong,
    aStarIsBorn,
    bringYourOwnBoo,
    thePeanutGallery,
    throwingTheMatch,
    infiniteLibrary,
    soulCycle,
    howToTrainYourWagon,
    birdsArentReal,
    chickenJockey,
  ]);

export {
  aStarIsBorn,
  adventurersSpeakeasy,
  allHat,
  aquariumOfCryptids,
  auroraLinePrivateCompartment,
  bankHeist1920sEscapeRoom,
  beachWhereSeaIsAbove,
  birdsArentReal,
  bowlingLeagueNight,
  brickByBrick,
  bringYourOwnBoo,
  buildABearEmptyMall,
  cableCarAcrossBiomes,
  capitalShipWarDinner,
  chainRestaurantTuesday,
  chickenJockey,
  cloudCastleMiniGolf,
  colosseumBoxFour,
  concessionStandHeatDeath,
  couchNightTakeout,
  countyFairFriday,
  cousinsWeddingPlusOne,
  dimSumAndThenSome,
  dinerElevenPm,
  dinosaurBbqAllYouCanEat,
  dmvNumberTicket,
  driveInLastReel,
  emptyRoomManyWindows,
  executiveLunchOneAgendaItem,
  groceryRunOneDinner,
  hardwareStoreOneProject,
  hawkerFloorSixBranches,
  hedgeWitchTeaHour,
  hephaestusForge,
  hotelBarLastCall,
  howToTrainYourWagon,
  impossibleLostAndFound,
  infiniteLibrary,
  itWasCheeseAllAlong,
  listeningBoothAfterClose,
  longAfternoonPoolBar,
  mallFoodCourtWeeknight,
  memoryCourseDinner,
  messHallAuriga,
  midnightNotaryTwoCleanPromises,
  moonPicnic,
  moonglassKilnAfterHours,
  museumExhibitMixup,
  notTheBees,
  olympusBottomlessBrunch,
  openHouseSunday,
  parkLoopWithADog,
  phantomDoorbellSuite,
  picnicOnBifrost,
  picnicOnSleepingGiant,
  pilgrimageMercySpine,
  potteryStudioDropIn,
  prophecyKaraoke,
  pulseCheck,
  rookToE4,
  softLaunchPhotoWall,
  soulCycle,
  tapWater,
  temporalCoffeeShop,
  thePeanutGallery,
  throwingTheMatch,
  underworldDepartmentMixer,
  vivariumWingTinyResidents,
  volcanoHotSpring,
  wetMarketThreeSeas,
  wetPaint,
  whaleConcertBelowWorld,
  worldSimOperatorBooth,
};
