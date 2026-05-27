import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";
import CustomHeader from "../../components/CustomHeader";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        header: () => <CustomHeader />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard" }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{ title: "Subscriptions" }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: "Calendar" }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings" }}
      />
    </Tabs>
  );
}
