import { Redirect } from "expo-router";

export default function Index() {
  // Simple mock: normally we'd check if user is logged in here
  return <Redirect href="/(tabs)" />;
}
