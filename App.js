import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";

const SUPABASE_URL =
  "https://vctzbxbmxckatjhijfye.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_y90-FpTEFmqJm0mDCaSe1g_Bk4i59tl";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

export default function App() {
  const [session, setSession] = useState(null);

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();

    setSession(data.session);
  };

  const handleAuth = async () => {
    if (
      !email.trim() ||
      !password ||
      (mode === "signup" && !name.trim())
    ) {
      Alert.alert(
        "Missing details",
        "Please fill all required fields."
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                full_name: name.trim(),
              },
            },
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          Alert.alert(
            "Success",
            "Account created successfully!"
          );
        } else {
          Alert.alert(
            "Account created",
            "Your account was created. Please verify your email if verification is required, then login."
          );
        }

        setMode("login");
        setName("");
        setPassword("");
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      Alert.alert(
        "Authentication Error",
        error.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadEpisodes = async () => {
    setLoadingEpisodes(true);

    try {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("is_published", true)
        .order("episode_number", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setEpisodes(data || []);
    } catch (error) {
      Alert.alert(
        "Episodes Error",
        error.message || "Could not load episodes."
      );
    } finally {
      setLoadingEpisodes(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadEpisodes();
    } else {
      setEpisodes([]);
    }
  }, [session]);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Logout Error", error.message);
    }
  };

  const handleUnlock = (episode) => {
    Alert.alert(
      "Episode Locked",
      `${episode.title}\n\nPrice: ₹${episode.price}\n\nPayment system will be connected next.`
    );
  };

  // =========================
  // LOGIN / SIGNUP SCREEN
  // =========================

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <KeyboardAvoidingView
          style={styles.authContainer}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.brandArea}>
            <Text style={styles.logo}>
              EpisodeVault
            </Text>

            <Text style={styles.subtitle}>
              Premium episodes for ₹20
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>
              {mode === "login"
                ? "Welcome back"
                : "Create account"}
            </Text>

            {mode === "signup" && (
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#777"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#777"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
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
              style={styles.switchButton}
              onPress={() => {
                setMode(
                  mode === "login"
                    ? "signup"
                    : "login"
                );
                setPassword("");
              }}
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

  // =========================
  // HOME SCREEN
  // =========================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.homeTitle}>
            EpisodeVault
          </Text>

          <Text style={styles.homeSubtitle}>
            Premium Episodes
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loadingEpisodes}
        onRefresh={loadEpisodes}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              All Episodes
            </Text>

            <Text style={styles.sectionSubtitle}>
              Unlock and watch premium content
            </Text>
          </View>
        }
        ListEmptyComponent={
          loadingEpisodes ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="large"
                color="#FFFFFF"
              />

              <Text style={styles.loadingText}>
                Loading episodes...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>
                🎬
              </Text>

              <Text style={styles.emptyTitle}>
                No episodes yet
              </Text>

              <Text style={styles.emptyText}>
                New episodes will appear here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.episodeCard}>
            <View style={styles.episodeTop}>
              <View style={styles.episodeNumber}>
                <Text style={styles.numberText}>
                  {item.episode_number}
                </Text>
              </View>

              <View style={styles.lockBadge}>
                <Text style={styles.lockText}>
                  🔒 LOCKED
                </Text>
              </View>
            </View>

            <Text style={styles.episodeLabel}>
              EPISODE {item.episode_number}
            </Text>

            <Text style={styles.episodeTitle}>
              {item.title}
            </Text>

            {item.description ? (
              <Text
                style={styles.description}
                numberOfLines={3}
              >
                {item.description}
              </Text>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.bottomRow}>
              <View>
                <Text style={styles.priceLabel}>
                  PRICE
                </Text>

                <Text style={styles.price}>
                  ₹{item.price}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => handleUnlock(item)}
              >
                <Text style={styles.unlockText}>
                  Unlock for ₹{item.price}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0F",
  },

  authContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  brandArea: {
    alignItems: "center",
    marginBottom: 32,
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },

  subtitle: {
    color: "#8F8F98",
    fontSize: 15,
    marginTop: 8,
  },

  card: {
    backgroundColor: "#17171D",
    borderRadius: 24,
    padding: 22,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 22,
  },

  input: {
    height: 54,
    backgroundColor: "#222229",
    borderRadius: 14,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 13,
  },

  button: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#0B0B0F",
    fontSize: 16,
    fontWeight: "900",
  },

  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },

  switchText: {
    color: "#AAAAAF",
    fontSize: 14,
    fontWeight: "600",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  homeTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
  },

  homeSubtitle: {
    color: "#85858D",
    fontSize: 13,
    marginTop: 3,
  },

  logoutButton: {
    backgroundColor: "#1C1C23",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 11,
  },

  logoutText: {
    color: "#FF7777",
    fontSize: 13,
    fontWeight: "800",
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  sectionHeader: {
    marginBottom: 17,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#777780",
    fontSize: 13,
    marginTop: 4,
  },

  episodeCard: {
    backgroundColor: "#17171D",
    borderRadius: 21,
    padding: 17,
    marginBottom: 15,
  },

  episodeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  episodeNumber: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#292930",
    alignItems: "center",
    justifyContent: "center",
  },

  numberText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  lockBadge: {
    backgroundColor: "#24242B",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },

  lockText: {
    color: "#9999A2",
    fontSize: 10,
    fontWeight: "800",
  },

  episodeLabel: {
    color: "#777780",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  episodeTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 4,
  },

  description: {
    color: "#9999A2",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  divider: {
    height: 1,
    backgroundColor: "#292930",
    marginVertical: 15,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceLabel: {
    color: "#66666F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  price: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 1,
  },

  unlockButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  unlockText: {
    color: "#0B0B0F",
    fontSize: 12,
    fontWeight: "900",
  },

  loadingBox: {
    alignItems: "center",
    paddingTop: 60,
  },

  loadingText: {
    color: "#777780",
    marginTop: 12,
    fontSize: 13,
  },

  emptyBox: {
    alignItems: "center",
    paddingTop: 70,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 15,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  emptyText: {
    color: "#777780",
    fontSize: 13,
    marginTop: 6,
  },
});
