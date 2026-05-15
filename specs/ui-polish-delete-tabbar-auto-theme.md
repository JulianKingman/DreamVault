# UI Polish: Delete Swiper Clipping, Animated Tab Indicator, Auto Appearance

Three independent items.

## 1. Delete swiper clips outside the card frame

### Problem
In `NoteList.tsx`, each row is `<Swipeable>` wrapping a card `YStack` with `borderRadius={20}` + `marginBottom="$2"`. The `renderRightActions` button (`$red9`, `borderRadius={0}`) is rendered by Swipeable as a sibling behind the card. It has square corners and spans the full Swipeable height — which includes the card's `marginBottom` — so the red area pokes out past the card's rounded corners and into the inter-card gap.

### Fix
Wrap `<Swipeable>` in a clipping container that owns the rounding and the bottom margin:

```tsx
<YStack borderRadius={20} overflow="hidden" marginBottom="$2" width="100%">
  <Swipeable renderRightActions={...} overshootRight={false}>
    <Link ...>
      <YStack backgroundColor="$backgroundStrong" width="100%">  {/* no radius/margin/overflow here */}
        ...
      </YStack>
    </Link>
  </Swipeable>
</YStack>
```

Both the card and the red action are now clipped to the same rounded rect, and the margin lives outside the Swipeable so the action no longer covers it. The action button keeps `borderRadius={0}` (the wrapper does the clipping).

## 2. Animated tab indicator

### Problem
`FloatingTabBar.tsx` renders the amber gradient square only on the focused tab (conditionally). Switching tabs makes it pop between positions with no transition.

### Approach
Single absolutely-positioned animated indicator instead of a per-tab conditional one.

- Change each tab `Pressable` to `flex: 1` so the 4 tabs occupy equal-width slots (currently `justify-content: space-around` — non-deterministic positions).
- Measure the inner row width via `onLayout` → `slotWidth = rowWidth / routeCount`.
- One `Animated.View` (reanimated) holding the `LinearGradient` square (`INDICATOR_SIZE = 46`, matching the current `padding:12` + `size:22` footprint).
- `translateX = useSharedValue`, on `state.index` change → `withTiming(targetX, { duration: 220 })`. Target: `index * slotWidth + (slotWidth - INDICATOR_SIZE) / 2`.
- Indicator renders behind the icons (lower in the tree). Icons still recolor instantly based on `isFocused` (`accentFg` vs `inactiveColor`) — no cross-fade, keeps it simple.
- First render (before layout measured): render nothing for the indicator until `rowWidth > 0` to avoid a flash at x=0.

`withTiming` over `withSpring` — the design is a crisp UI chrome element, a spring overshoot would feel loose. Open to spring if you'd prefer bouncier.

## 3. "Auto" appearance mode

### Behavior (per request)
- 09:00–20:00 → light
- 20:00–23:00 and 05:00–09:00 → twilight (internal name `dark`)
- 23:00–05:00 → midnight

### Changes
`ThemeContext.tsx`:
- Add `'auto'` to `ThemeMode`.
- `resolveAutoTheme(date): ResolvedTheme` implementing the table above. All 24h covered, no gaps.
- When `themeMode === 'auto'`, resolve from a `now` state that refreshes every 60s via `setInterval`, plus an `AppState` `active` listener so it re-checks on foreground. Interval/listener only armed while mode is `auto`.
- `resolvedTheme` gains the `auto` branch.

`settings.tsx`:
- Add an "Auto" row to the Appearance group (icon: `Clock` or `Wand2` from lucide). Selected when `themeMode === 'auto'`.
- Optionally show the currently-resolved theme name as the row's `right` slot (e.g. "Twilight") so the user can see what Auto picked. Will include this unless you'd rather keep it plain.

### Out of scope
- No transition animation between themes when Auto flips — instant swap (consistent with existing manual switching).
- `'system'` mode stays as-is.

## Risk / notes
- Item 2 touches gesture-free layout only; no change to navigation behavior.
- Item 3's interval is cheap (1/min) and only while Auto is active.
- All three are JS-only — no native rebuild, just a Metro reload (or a fresh Release build when you want it on-device standalone).
