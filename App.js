import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";

const SUPABASE_URL = "https://vctzbxbmxckatjhijfye.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_y90-FpTEFmqJm0mDCaSe1g_Bk4i59tl";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

export default function App() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (mode === "signup" && !name)) {
      Alert.alert("Missing details", "Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        Alert.alert(
          "Account created",
          "Your account has been created successfully."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        Alert.alert("Success", "Login successful!");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <Text style={styles.logo}>EpisodeVault</Text>
        <Text style={styles.subtitle}>
          Watch premium episodes for ₹20
        </Text>

        <View style={styles.card}>
          <Text style={styles.heading}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </Text>

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login"
                : "Create Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setMode(mode === "login" ? "signup" : "login")
            }
          >
            <Text style={styles.switchText}>
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: "#999999",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 35,
  },

  card: {
    backgroundColor: "#17171D",
    borderRadius: 22,
    padding: 22,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 22,
  },

  input: {
    backgroundColor: "#222229",
    color: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 14,
    fontSize: 15,
  },

  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 5,
  },

  buttonText: {
    color: "#0B0B0F",
    fontSize: 16,
    fontWeight: "800",
  },

  switchText: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});
