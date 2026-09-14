import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createClient } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";

const SUPABASE_URL = "https://vctzbxbmxckatjhijfye.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_y90-FpTEFmqJm0mDCaSe1g_Bk4i59tl";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const UPI_ID = "paytmqr1x5zqedbf2@paytm";
const PRICE = 20;

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const [episodes, setEpisodes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadEpisodes();
      loadPurchases();
      loadPayments();
    }
  }, [session]);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);
    setLoading(false);
  }

  async function login() {
    if (!email || !password) {
      Alert.alert("Error", "Email and password enter karo.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert("Login Failed", error.message);
    }
  }

  async function signup() {
    if (!name || !email || !password) {
      Alert.alert("Error", "Sabhi details fill karo.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      Alert.alert("Signup Failed", error.message);
      return;
    }

    Alert.alert(
      "Success",
      "Account create ho gaya. Agar email verification enabled hai, email verify karo."
    );

    setIsSignup(false);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function loadEpisodes() {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("is_published", true)
      .order("episode_number", { ascending: true });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setEpisodes(data || []);
  }

  async function loadPurchases() {
    const { data, error } = await supabase
      .from("purchases")
      .select("episode_id")
      .eq("user_id", session.user.id);

    if (!error) {
      setPurchases(data || []);
    }
  }

  async function loadPayments() {
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setPayments(data || []);
    }
  }

  function isPurchased(episodeId) {
    return purchases.some(
      (purchase) => purchase.episode_id === episodeId
    );
  }

  function getPaymentForEpisode(episodeId) {
    return payments.find(
      (payment) =>
        payment.episode_id === episodeId &&
        payment.status === "pending"
    );
  }

  async function chooseScreenshot() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Screenshot select karne ke liye gallery permission allow karo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setScreenshot(result.assets[0]);
    }
  }

  async function submitPayment() {
    if (!selectedEpisode) return;

    if (!utr.trim()) {
      Alert.alert("Missing UTR", "UTR / Transaction ID enter karo.");
      return;
    }

    if (!screenshot) {
      Alert.alert(
        "Missing Screenshot",
        "Payment screenshot select karo."
      );
      return;
    }

    if (getPaymentForEpisode(selectedEpisode.id)) {
      Alert.alert(
        "Already Submitted",
        "Is episode ka payment already pending hai."
      );
      return;
    }

    try {
      setSubmitting(true);

      const extension =
        screenshot.fileName?.split(".").pop() || "jpg";

      const fileName =
        `${session.user.id}/${Date.now()}.${extension}`;

      const response = await fetch(screenshot.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, blob, {
          contentType: screenshot.mimeType || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);

      const { error: paymentError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: session.user.id,
          episode_id: selectedEpisode.id,
          amount: PRICE,
          utr: utr.trim(),
          screenshot_url: publicUrl,
          status: "pending",
        });

      if (paymentError) {
        throw paymentError;
      }

      Alert.alert(
        "Payment Submitted",
        "Payment verification ke liye bhej diya gaya hai."
      );

      setSelectedEpisode(null);
      setUtr("");
      setScreenshot(null);

      await loadPayments();
    } catch (error) {
      Alert.alert(
        "Submission Failed",
        error.message || "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openPaymentScreen(episode) {
    setSelectedEpisode(episode);
    setUtr("");
    setScreenshot(null);
  }

  function openUPI() {
    const url =
      `upi://pay?pa=${UPI_ID}&pn=EpisodeVault&am=${PRICE}&cu=INR`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "UPI App Not Found",
        "Apne UPI/GPay/Paytm app se manually payment karo."
      );
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.authBox}>
          <Text style={styles.logo}>EpisodeVault</Text>

          <Text style={styles.subtitle}>
            Watch premium episodes
          </Text>

          {isSignup && (
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#777"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#777"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#777"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={isSignup ? signup : login}
          >
            <Text style={styles.buttonText}>
              {isSignup ? "Create Account" : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignup(!isSignup)}
          >
            <Text style={styles.switchText}>
              {isSignup
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (selectedEpisode) {
    const pending = getPaymentForEpisode(selectedEpisode.id);

    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        <TouchableOpacity
          onPress={() => setSelectedEpisode(null)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>
          Unlock Episode {selectedEpisode.episode_number}
        </Text>

        <View style={styles.paymentCard}>
          <Text style={styles.episodeTitle}>
            {selectedEpisode.title}
          </Text>

          <Text style={styles.price}>₹{PRICE}</Text>

          <Text style={styles.instruction}>
            Step 1: ₹{PRICE} payment karo
          </Text>

          <Text style={styles.upiLabel}>UPI ID</Text>

          <View style={styles.upiBox}>
            <Text style={styles.upiText}>{UPI_ID}</Text>
          </View>

          <TouchableOpacity
            style={styles.upiButton}
            onPress={openUPI}
          >
            <Text style={styles.buttonText}>
              Pay ₹{PRICE} via UPI
            </Text>
          </TouchableOpacity>

          <Text style={styles.instruction}>
            Step 2: Payment ke baad UTR / Transaction ID enter karo
          </Text>

          <TextInput
            placeholder="Enter UTR / Transaction ID"
            placeholderTextColor="#777"
            style={styles.input}
            value={utr}
            onChangeText={setUtr}
          />

          <Text style={styles.instruction}>
            Step 3: Payment screenshot upload karo
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={chooseScreenshot}
          >
            <Text style={styles.secondaryText}>
              {screenshot
                ? "Screenshot Selected ✓"
                : "Select Payment Screenshot"}
            </Text>
          </TouchableOpacity>

          {screenshot && (
            <Image
              source={{ uri: screenshot.uri }}
              style={styles.preview}
            />
          )}

          {pending ? (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingText}>
                ⏳ Payment verification pending
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={submitPayment}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>
                {submitting
                  ? "Submitting..."
                  : "Submit Payment"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logoSmall}>EpisodeVault</Text>
          <Text style={styles.welcome}>
            Premium Episodes
          </Text>
        </View>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No episodes available yet.
          </Text>
        }
        renderItem={({ item }) => {
          const unlocked = isPurchased(item.id);
          const pending = getPaymentForEpisode(item.id);

          return (
            <View style={styles.card}>
              {item.thumbnail_url ? (
                <Image
                  source={{ uri: item.thumbnail_url }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              )}

              <View style={styles.cardContent}>
                <Text style={styles.episodeNumber}>
                  EPISODE {item.episode_number}
                </Text>

                <Text style={styles.cardTitle}>
                  {item.title}
                </Text>

                {item.description ? (
                  <Text style={styles.description}>
                    {item.description}
                  </Text>
                ) : null}

                <Text style={styles.cardPrice}>
                  ₹{item.price || PRICE}
                </Text>

                {unlocked ? (
                  <TouchableOpacity
                    style={styles.watchButton}
                    onPress={() =>
                      Alert.alert(
                        "Unlocked",
                        "Video player next step mein add karenge."
                      )
                    }
                  >
                    <Text style={styles.buttonText}>
                      ▶ Watch Episode
                    </Text>
                  </TouchableOpacity>
                ) : pending ? (
                  <View style={styles.pendingSmall}>
                    <Text style={styles.pendingText}>
                      ⏳ Payment Pending
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => openPaymentScreen(item)}
                  >
                    <Text style={styles.buttonText}>
                      🔒 Unlock for ₹{item.price || PRICE}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
    paddingTop: 55,
  },

  center: {
    flex: 1,
    backgroundColor: "#090909",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#fff",
    marginTop: 12,
  },

  authBox: {
    margin: 24,
    marginTop: 80,
  },

  logo: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },

  logoSmall: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 35,
  },

  input: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
    marginBottom: 12,
    fontSize: 15,
  },

  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },

  switchText: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 20,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    color: "#777",
    marginTop: 3,
  },

  logout: {
    color: "#aaa",
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#151515",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#252525",
  },

  thumbnail: {
    width: "100%",
    height: 190,
  },

  thumbnailPlaceholder: {
    height: 190,
    backgroundColor: "#202020",
    justifyContent: "center",
    alignItems: "center",
  },

  playIcon: {
    color: "#fff",
    fontSize: 40,
  },

  cardContent: {
    padding: 18,
  },

  episodeNumber: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },

  description: {
    color: "#999",
    marginTop: 8,
    lineHeight: 20,
  },

  cardPrice: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 14,
  },

  watchButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
  },

  pendingSmall: {
    backgroundColor: "#242424",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 14,
  },

  pendingBox: {
    backgroundColor: "#202020",
    padding: 15,
    borderRadius: 12,
    marginTop: 14,
  },

  pendingText: {
    color: "#ddd",
    textAlign: "center",
    fontWeight: "600",
  },

  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 60,
  },

  backButton: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  backText: {
    color: "#fff",
    fontSize: 18,
  },

  pageTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  paymentCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "#151515",
    borderRadius: 18,
  },

  episodeTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "700",
  },

  price: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    marginVertical: 18,
  },

  instruction: {
    color: "#aaa",
    lineHeight: 21,
    marginTop: 15,
    marginBottom: 10,
  },

  upiLabel: {
    color: "#777",
    fontSize: 12,
    marginBottom: 5,
  },

  upiBox: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 15,
  },

  upiText: {
    color: "#fff",
    fontWeight: "700",
  },

  upiButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 12,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },

  secondaryText: {
    color: "#fff",
    fontWeight: "600",
  },

  preview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 12,
  },
});
