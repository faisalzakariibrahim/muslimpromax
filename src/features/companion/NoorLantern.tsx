import { View } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Circle, Rect, G } from "react-native-svg";
import type { NoorState } from "./noor";
import { theme } from "../../lib/theme";

/** The lantern. Brightness and halo scale with Noor's glow (0..1). */
export function NoorLantern({ state, size = 180 }: { state: NoorState; size?: number }) {
  const glow = Math.max(0.12, state.glow);
  const flameOpacity = 0.35 + glow * 0.65;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="42%" r="50%">
            <Stop offset="0%" stopColor={theme.colors.gold} stopOpacity={flameOpacity} />
            <Stop offset="100%" stopColor={theme.colors.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* halo */}
        <Circle cx="50" cy="44" r="46" fill="url(#halo)" />
        {/* lantern body */}
        <G>
          <Rect x="38" y="20" width="24" height="8" rx="3" fill={theme.colors.gold} opacity={0.9} />
          <Rect x="34" y="28" width="32" height="40" rx="8" fill={theme.colors.surface2} stroke={theme.colors.gold} strokeWidth="1.5" />
          {/* flame */}
          <Circle cx="50" cy="50" r={6 + glow * 6} fill={theme.colors.gold} opacity={flameOpacity} />
          <Circle cx="50" cy="50" r={3 + glow * 3} fill="#FFF3D6" opacity={flameOpacity} />
          <Rect x="42" y="68" width="16" height="6" rx="2" fill={theme.colors.gold} opacity={0.9} />
        </G>
      </Svg>
    </View>
  );
}
