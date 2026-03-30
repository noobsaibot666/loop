import {
  MIN_LOOP_WAYPOINTS,
  buildFallbackLoopWaypoints,
  buildGoogleMapsLoopUrl,
  hasUsableLoopWaypoints,
  isUsableLoopRouteUrl,
  parseGoogleMapsLoopUrl,
  sampleLoopMapsWaypoints,
} from "../shared/loop-quality.js";
import { buildNightRideMapsUrl, sampleLoopWaypoints } from "../shared/night-rides.js";

const origin = { lat: 52.508896, lng: 13.380206 };
const route = [
  [13.380206, 52.508896],
  [13.372101, 52.513944],
  [13.362948, 52.516482],
  [13.354589, 52.512615],
  [13.349802, 52.505704],
  [13.352331, 52.498901],
  [13.360722, 52.494925],
  [13.372954, 52.493218],
  [13.386338, 52.494818],
  [13.397722, 52.500331],
  [13.404641, 52.507948],
  [13.401356, 52.515012],
  [13.392644, 52.518404],
  [13.384221, 52.516881],
  [13.380206, 52.508896],
];

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const loopWaypoints = sampleLoopMapsWaypoints(route, 14);
assert(
  hasUsableLoopWaypoints(loopWaypoints),
  `loop waypoint sampler returned fewer than ${MIN_LOOP_WAYPOINTS} usable waypoints`,
);

const loopUrl = buildGoogleMapsLoopUrl(origin, loopWaypoints);
assert(loopUrl.includes("/maps/dir/"), "loop route URL is not using path-style Google Maps directions");
assert(isUsableLoopRouteUrl(loopUrl), "loop route URL does not parse back into a usable loop");

const parsedLoop = parseGoogleMapsLoopUrl(loopUrl);
assert(parsedLoop.origin, "loop route URL is missing its origin when parsed");
assert(
  parsedLoop.waypoints.length >= MIN_LOOP_WAYPOINTS,
  "loop route URL lost waypoint data when parsed back",
);

const fallbackWaypoints = buildFallbackLoopWaypoints(origin, 14, 321);
assert(
  hasUsableLoopWaypoints(fallbackWaypoints),
  `fallback loop returned fewer than ${MIN_LOOP_WAYPOINTS} waypoints`,
);
assert(
  isUsableLoopRouteUrl(buildGoogleMapsLoopUrl(origin, fallbackWaypoints)),
  "fallback loop URL is not usable",
);

const nightWaypoints = sampleLoopWaypoints(route, 14);
assert(
  hasUsableLoopWaypoints(nightWaypoints),
  "night ride loop waypoint sampler is below the usable threshold",
);

const nightLoopUrl = buildNightRideMapsUrl({
  origin,
  destination: origin,
  waypoints: nightWaypoints,
});
assert(
  isUsableLoopRouteUrl(nightLoopUrl),
  "night ride loop URL does not parse back into a usable loop",
);

const legacyQueryLoopUrl =
  "https://www.google.com/maps/dir/?api=1&origin=52.508896,13.380206&destination=52.508896,13.380206&travelmode=bicycling&waypoints=52.504971,13.347069|52.528881,13.357201|52.52486,13.404678|52.497424,13.41717|52.489447,13.375147";
const normalizedLegacyPath = legacyQueryLoopUrl
  .replace("https://www.google.com/maps/dir/?api=1&origin=52.508896,13.380206&destination=52.508896,13.380206&travelmode=bicycling&waypoints=", "https://www.google.com/maps/dir/52.508896,13.380206/")
  .replaceAll("|", "/")
  .concat("/52.508896,13.380206/data=!4m2!4m1!3e1");
assert(
  parseGoogleMapsLoopUrl(legacyQueryLoopUrl).waypoints.length >= MIN_LOOP_WAYPOINTS,
  "legacy query-style loop URL no longer parses correctly",
);
assert(
  parseGoogleMapsLoopUrl(normalizedLegacyPath).waypoints.length >= MIN_LOOP_WAYPOINTS,
  "normalized path-style loop URL no longer parses correctly",
);

console.log("Loop route verification passed.");
console.log(
  JSON.stringify(
    {
      minLoopWaypoints: MIN_LOOP_WAYPOINTS,
      sampledLoopWaypoints: loopWaypoints.length,
      fallbackLoopWaypoints: fallbackWaypoints.length,
      sampledNightWaypoints: nightWaypoints.length,
      loopUrl,
      nightLoopUrl,
    },
    null,
    2,
  ),
);
