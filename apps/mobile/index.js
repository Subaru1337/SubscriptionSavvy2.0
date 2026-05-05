import { StrictMode } from "react";
import { AppRegistry } from "react-native";
import { ExpoRoot } from "expo-router";
import "./global.css";

export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

AppRegistry.registerComponent("main", () => App);
