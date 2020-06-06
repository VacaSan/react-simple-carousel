import "./styles.css";
import React from "react";
import {
  attr,
  first,
  last,
  clamp,
  callAll,
  makeStops,
  projection,
  findClosestMatch,
  rubberBandIfOutOfBounds,
  useSize,
} from "./utils";

import { animated, useSpring } from "react-spring";
import { useDrag } from "react-use-gesture";

const KaruseruContext = React.createContext(undefined);

function Karuseru({ children }) {
  const [stops, setStops] = React.useState([0]);
  const stopsRef = React.useRef(stops);
  stopsRef.current = stops;

  const [activeIndex, setActiveIndex] = React.useState(0);

  const [{ x }, set] = useSpring(() => ({
    x: 0,
    // cannot use state<stops> because onChange probably gets wrapped in
    // useCallback, we need to use "live" collection, like ref
    onChange: x =>
      setActiveIndex(
        stopsRef.current.indexOf(findClosestMatch(stopsRef.current, x))
      ),
  }));

  const strStops = JSON.stringify(stops);
  const value = React.useMemo(() => {
    return {
      x,
      set,
      stops: JSON.parse(strStops),
      stopsRef,
      setStops,
      activeIndex,
    };
  }, [x, set, activeIndex, strStops, setStops]);

  return (
    <KaruseruContext.Provider value={value}>
      {children}
    </KaruseruContext.Provider>
  );
}

// TODO https://www.w3.org/TR/wai-aria-practices/#carousel
function KaruseruItems({ children, align, contain, ...props }) {
  const { x, set, activeIndex, stopsRef, setStops } = React.useContext(
    KaruseruContext
  );

  /** @type {React.RefObject<HTMLUListElement>} */
  const ref = React.useRef(null);

  const { width } = useSize(ref);

  React.useLayoutEffect(() => {
    setStops(prevItems => {
      // TODO use prevItems to maintain same index
      const nextItems = makeStops(ref.current, { align, contain });
      const nextX = findClosestMatch(nextItems, x.get());
      set({ x: nextX, immediate: false });
      return nextItems;
    });
  }, [x, set, setStops, align, contain, children, width]);

  const bind = useDrag(
    ({ last: isLast, movement: [movementX], vxvy: [velocityX], memo }) => {
      if (!memo) {
        memo = x.get() - movementX;
      }

      let newX;
      if (isLast) {
        const projectedX = x.get() + projection(velocityX, 0.99);
        newX = findClosestMatch(stopsRef.current, projectedX);
      } else {
        newX = rubberBandIfOutOfBounds(
          last(stopsRef.current),
          first(stopsRef.current),
          memo + movementX
        );
      }

      set({ x: newX, immediate: !isLast });

      return memo;
    }
  );

  // keep an eye on this -> https://github.com/reach/reach-ui/tree/master/packages/descendants
  const items = React.Children.map(children, (child, index) =>
    React.cloneElement(child, { index, activeIndex })
  );

  return (
    <animated.ul
      ref={ref}
      {...props}
      {...bind()}
      data-karuseru-items=""
      style={{
        transform: x.to(x => `translateX(${x}px)`),
      }}
    >
      {items}
    </animated.ul>
  );
}
KaruseruItems.defaultProps = {
  align: "center",
  contain: true,
};

function KaruseruItem({ index, activeIndex, ...props }) {
  const isActive = index === activeIndex;

  return (
    <li
      {...props}
      {...attr(
        { "data-karuseru-item": "" },
        isActive && { "data-karuseru-item-active": "" }
      )}
    />
  );
}

function KaruseruNext(props) {
  const { stopsRef, set, stops, activeIndex } = React.useContext(
    KaruseruContext
  );

  const next = React.useCallback(() => {
    const nextIndex = clamp(0, stopsRef.current.length - 1, activeIndex + 1);
    set({ x: stopsRef.current[nextIndex], immediate: false });
  }, [set, stopsRef, activeIndex]);

  return (
    <button
      disabled={activeIndex >= stops.length - 1}
      data-karuseru-button-next=""
      {...props}
      onClick={callAll(next, props.onClick)}
    />
  );
}
KaruseruNext.defaultProps = {
  children: "next",
};

function KaruseruPrev(props) {
  const { stopsRef, set, activeIndex } = React.useContext(KaruseruContext);

  const prev = React.useCallback(() => {
    const nextIndex = clamp(0, stopsRef.current.length - 1, activeIndex - 1);
    set({ x: stopsRef.current[nextIndex], immediate: false });
  }, [set, stopsRef, activeIndex]);

  return (
    <button
      disabled={activeIndex <= 0}
      data-karuseru-button-prev=""
      {...props}
      onClick={callAll(prev, props.onClick)}
    />
  );
}
KaruseruPrev.defaultProps = {
  children: "prev",
};

function KaruseruNav({ renderItem, ...props }) {
  const { stops, activeIndex, set } = React.useContext(KaruseruContext);

  const goTo = React.useCallback(stop => set({ x: stop }), [set]);

  return (
    <div data-karuseru-nav="" {...props}>
      {stops.map((stop, index) => {
        const isActive = activeIndex === index;

        return (
          <React.Fragment key={index}>
            {renderItem({
              index,
              activeIndex,
              onClick: () => goTo(stop), // maybe re-name?
              ...attr(
                { "data-karuseru-nav-item": "" },
                isActive && { "data-karuseru-nav-item-active": "" }
              ),
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}
KaruseruNav.defaultProps = {
  renderItem: ({ index, activeIndex: _, ...props }) => (
    <button {...props}>{index}</button>
  ),
};

export {
  Karuseru,
  KaruseruItem,
  KaruseruItems,
  KaruseruNext,
  KaruseruPrev,
  KaruseruNav,
};
