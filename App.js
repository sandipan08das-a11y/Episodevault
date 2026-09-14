import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.logo}>EpisodeVault</Text>
      <Text style={styles.subtitle}>Watch premium episodes</Text>

      <View style={styles.card}>
        <Text style={styles.episode}>EPISODE 01</Text>
        <Text style={styles.title}>Your first episode</Text>
        <Text style={styles.price}>₹20</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
    padding: 24,
    paddingTop: 80,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#999999",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#17171D",
    borderRadius: 20,
    padding: 22,
  },
  episode: {
    color: "#AAAAAA",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
    marginTop: 8,
  },
  price: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 15,
  },
});
