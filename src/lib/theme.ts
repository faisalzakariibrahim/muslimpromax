export const theme = {
  colors: {
    bg: "#0A1713",
    surface: "#10211B",
    surface2: "#173029",
    primary: "#6BC79E", // lantern green-gold
    primaryDark: "#0A1713",
    gold: "#E6C178",
    text: "#F2F6F4",
    textDim: "rgba(242,246,244,0.68)",
    textFaint: "rgba(242,246,244,0.4)",
    danger: "#E2725B",
  },
  radius: { sm: 10, md: 16, lg: 24, pill: 999 },
  space: (n: number) => n * 4,
};
export type Theme = typeof theme;
