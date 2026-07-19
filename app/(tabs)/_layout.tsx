import { Tabs, Redirect } from 'expo-router'
import { useAuth } from '../../lib/AuthContext'

export default function TabsLayout() {
  const { session } = useAuth()

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Facturas',
          tabBarLabel: 'Facturas',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'Nueva',
          tabBarLabel: 'Nueva',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarLabel: 'Clientes',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  )
}
