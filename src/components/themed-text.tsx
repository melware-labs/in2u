import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Inter se carga como un archivo por peso (ver _layout.tsx / useFonts), así
// que el peso va en fontFamily, no en fontWeight — no hay negrita sintética.
const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  smallBold: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
    lineHeight: 19,
  },
  default: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  link: {
    fontFamily: Fonts.body,
    lineHeight: 20,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: Fonts.body,
    lineHeight: 20,
    fontSize: 14,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
