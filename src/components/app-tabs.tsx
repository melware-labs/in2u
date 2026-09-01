import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Iconos placeholder reciclados del template de Expo — reemplazar por los
// definitivos cuando haya branding propio.
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <NativeTabs backgroundColor={colors.background} tintColor={colors.text}>
      <NativeTabs.Trigger name="index">
        <Label>Nosotros</Label>
        <Icon src={require('@/assets/images/tabIcons/home.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendario">
        <Label>Calendario</Label>
        <Icon src={require('@/assets/images/tabIcons/explore.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <Label>Perfil</Label>
        <Icon src={require('@/assets/images/tabIcons/home.png')} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
