import { useSpring } from "react-spring";

/**
 * Use this wrapper hook instead of useSpring from react-spring
 * to make sure that your spring animations have velocity,
 * even when parts of the animation have been delegated to other means of control
 * (e.g. gestures)
 */

function getTrackedVar(_trackedVar, initialConfig) {
  if (_trackedVar) return _trackedVar;
  const hasX = initialConfig.x !== undefined;
  const hasY = initialConfig.y !== undefined;
  if ((hasX && hasY) || (!hasX && !hasY)) {
    throw new Error(
      "[useVelocityTrackedSpring] can't automatically detect which variable to track, so you need to specify which variable should be tracked in the second argument"
    );
  }
  return hasX ? "x" : "y";
}

// https://github.com/aholachek/mobile-first-animation/blob/master/src/useVelocityTrackedSpring.js
function useVelocityTrackedSpring(initialConfigFunc, _trackedVar) {
  const initialConfig = initialConfigFunc();
  const trackedVar = getTrackedVar(_trackedVar, initialConfig);
  const [springValues, set] = useSpring(initialConfigFunc);
  const [{ velocityTracker }, setVelocityTracker] = useSpring(() => ({
    velocityTracker: initialConfig[trackedVar],
    ...initialConfig,
  }));

  // you can disable the tracking or setting of velocity by providing options in the second argument
  const wrappedSet = (data, { skipTrackVelocity, skipSetVelocity } = {}) => {
    // update velocity tracker
    const velocityTrackerArgs = { config: data.config };
    if (data[trackedVar] && !skipTrackVelocity)
      velocityTrackerArgs.velocityTracker = data[trackedVar];
    setVelocityTracker(velocityTrackerArgs);

    // update actual spring
    if (data.immediate) return set(data);
    set({
      ...data,
      config: {
        ...data.config,
        velocity: !skipSetVelocity && velocityTracker.lastVelocity,
      },
    });
  };
  return [springValues, wrappedSet];
}

// https://mobile-first-animation.netlify.app/26
const projection = (initialVelocity, decelerationRate) =>
  (initialVelocity * decelerationRate) / (1.0 - decelerationRate);

const callAll = (...fns) => (...args) => fns.forEach(fn => fn && fn(...args));

function makeStops(el, align) {
  const containerWidth = el.offsetWidth;
  return Array.from(el.children, child => {
    return makeStop(child.offsetLeft, child.offsetWidth, containerWidth, align);
  });
}

function makeStop(offset, width, containerWidth, align) {
  switch (align) {
    case "center":
      return -(offset - (containerWidth - width) / 2);
    case "right":
      return -(offset - (containerWidth - width));
    default:
      return -offset;
  }
}

// TODO re-name findClosestMatch(x:number, stops: number[]):number
function findIndex({ x, stops }) {
  const nextX = stops.reduce((prev, curr) => {
    return Math.abs(curr - x) < Math.abs(prev - x) ? curr : prev;
  });
  return stops.indexOf(nextX);
}

function getStop(state, node = "CURRENT") {
  const index = findIndex(state);
  switch (node) {
    case "NEXT":
      return state.stops[Math.min(index + 1, state.stops.length - 1)];
    case "PREV":
      return state.stops[Math.max(index - 1, 0)];
    default:
      return state.stops[index];
  }
}

export {
  makeStop,
  makeStops,
  getStop,
  callAll,
  findIndex,
  projection,
  useVelocityTrackedSpring,
};
