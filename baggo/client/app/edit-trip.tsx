import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import { Colors } from "@/constants/Colors";
import { MapPin, Calendar, Weight, Plane, Bus, Train, Car, Ship, MoreHorizontal } from "lucide-react-native";
import { backendomain } from "@/utils/backendDomain";

const RAPID_API_KEY = "764ae3a2d0msh0d44a93e665c289p104415jsn9a0e1853cc6e";

export default function EditTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // expects tripId
  const tripId = params.id;

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form fields
  const [fromCountry, setFromCountry] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCountry, setToCountry] = useState("");
  const [toCity, setToCity] = useState("");
  const [availableKg, setAvailableKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [travelMeans, setTravelMeans] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isArrivalDatePickerVisible, setArrivalDatePickerVisibility] = useState(false);

  // --- Modal state ---
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectingField, setSelectingField] = useState(null);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const cityInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchTrip();
    fetchCountries();
  }, []);

  const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};


  const fetchTrip = async () => {
    try {
      const res = await axios.get(`${backendomain.backendomain}/api/baggo/MyTrips`, {
        withCredentials: true,
      });
      console.log("MyTrips response:", res.data);

      const trips = res.data?.trips || [];
      const trip = trips.find((t) => t.id === tripId);

      if (!trip) {
        Alert.alert("Error", "Trip not found");
        setLoading(false);
        return;
      }

      setTripData(trip);

      const [fromCityName, fromCountryName] = trip.fromLocation.split(", ");
      const [toCityName, toCountryName] = trip.toLocation.split(", ");

      setFromCity(fromCityName);
      setFromCountry(fromCountryName);
      setToCity(toCityName);
      setToCountry(toCountryName);
      setAvailableKg(trip.availableKg?.toString() || "");
      setPricePerKg(trip.pricePerKg?.toString() || "");
      setTravelMeans(trip.travelMeans);
      setDepartureDate(trip.departureDate); // keep ISO string
setArrivalDate(trip.arrivalDate);     // keep ISO string


    } catch (err) {
      console.error("Fetch trip error:", err);
      Alert.alert("Error", "Failed to fetch trip data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,flags");
      const formatted = res.data
        .map((c) => ({
          name: c?.name?.common || "",
          flag: c?.flags?.png || null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCountries(formatted);
    } catch {
      Alert.alert("Error", "Could not fetch countries");
    }
  };

  const fetchCities = async (countryName: string) => {
    try {
      setLoadingCities(true);
      const codeRes = await axios.get(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true&fields=cca2`
      );
      const countryCode = codeRes.data?.[0]?.cca2?.toUpperCase();
      if (!countryCode) return [];

      const response = await axios.get(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities`, {
        headers: {
          "X-RapidAPI-Key": RAPID_API_KEY,
          "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
        },
        params: {
          countryIds: countryCode,
          limit: 10,
          sort: "-population",
        },
      });
      return response.data?.data?.map((c) => c.name) || [];
    } catch (err) {
      console.error("City fetch error:", err);
      return [];
    } finally {
      setLoadingCities(false);
    }
  };

  const openCountryModal = (field) => {
    setSelectingField(field);
    setCountrySearch("");
    setShowCountryModal(true);
  };

  const openCityModal = async (field) => {
    const country = field === "from" ? fromCountry : toCountry;
    if (!country) {
      Alert.alert("Select Country First", "Please choose a country before selecting a city.");
      return;
    }
    setSelectingField(field);
    setShowCityModal(true);
    const cityList = await fetchCities(country);
    setCities(cityList);
  };

  const handleSelectCountry = (name) => {
    selectingField === "from" ? setFromCountry(name) : setToCountry(name);
    setShowCountryModal(false);
  };
  const handleSelectCity = (name) => {
    selectingField === "from" ? setFromCity(name) : setToCity(name);
    setShowCityModal(false);
  };

  const handleConfirmDate = (date) => {
    setDepartureDate(date.toISOString().split("T")[0]);
    setDatePickerVisibility(false);
  };

  const handleUpdate = async () => {
    if (!fromCountry || !fromCity || !toCountry || !toCity || !departureDate || !arrivalDate || !availableKg || !travelMeans) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.put(
        `${backendomain.backendomain}/api/baggo/Trip/${tripId}`,
        {
          fromLocation: `${fromCity}, ${fromCountry}`,
          toLocation: `${toCity}, ${toCountry}`,
          departureDate,
          arrivalDate,
          availableKg: parseFloat(availableKg),
          travelMeans,
        },
        { withCredentials: true }
      );
      if (res.status !== 200) throw new Error("Failed to update trip");
      router.back();
    } catch (err) {
      console.error("Update trip error:", err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Edit Trip</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* From Section */}
        <Text style={styles.label}>From Country</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => openCountryModal("from")}>
          <MapPin size={20} color={Colors.textLight} />
          <Text style={styles.input}>{fromCountry || "Select Country"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>From City</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => openCityModal("from")}>
          <MapPin size={20} color={Colors.textLight} />
          <Text style={styles.input}>{fromCity || "Select City"}</Text>
        </TouchableOpacity>

        {/* To Section */}
        <Text style={styles.label}>To Country</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => openCountryModal("to")}>
          <MapPin size={20} color={Colors.textLight} />
          <Text style={styles.input}>{toCountry || "Select Country"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>To City</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => openCityModal("to")}>
          <MapPin size={20} color={Colors.textLight} />
          <Text style={styles.input}>{toCity || "Select City"}</Text>
        </TouchableOpacity>

        {/* Travel Mode */}
        <Text style={styles.label}>Travel Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeContainer}>
          {["airplane", "bus", "train", "car", "ship", "other"].map((mode) => {
            const Icon = { airplane: Plane, bus: Bus, train: Train, car: Car, ship: Ship, other: MoreHorizontal }[mode];
            return (
              <TouchableOpacity key={mode} style={[styles.modeButton, travelMeans === mode && styles.modeButtonActive]} onPress={() => setTravelMeans(mode)}>
                <Icon size={18} color={travelMeans === mode ? Colors.white : Colors.textLight} />
                <Text style={[styles.modeText, { color: travelMeans === mode ? Colors.white : Colors.text }]}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Departure & Arrival */}
        <Text style={styles.label}>Departure Date</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => setDatePickerVisibility(true)}>
          <Calendar size={20} color={Colors.textLight} />
          <Text style={styles.input}>{departureDate ? formatDate(departureDate) : "Select Departure Date"}</Text>
        </TouchableOpacity>
        <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirmDate} onCancel={() => setDatePickerVisibility(false)} minimumDate={new Date()} />

        <Text style={styles.label}>Arrival Date</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => setArrivalDatePickerVisibility(true)}>
          <Calendar size={20} color={Colors.textLight} />
          <Text style={styles.input}>{arrivalDate ? formatDate(arrivalDate) : "Select Arrival Date"}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isArrivalDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setArrivalDate(date.toISOString().split("T")[0]);
            setArrivalDatePickerVisibility(false);
          }}
          onCancel={() => setArrivalDatePickerVisibility(false)}
          minimumDate={new Date(departureDate || new Date())}
        />

        {/* Available Kg */}
        <Text style={styles.label}>Available Luggage Space (kg)</Text>
        <View style={styles.inputContainer}>
          <Weight size={20} color={Colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder="Enter available weight"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={availableKg}
            onChangeText={setAvailableKg}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitButton, loading && { opacity: 0.6 }]} onPress={handleUpdate} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitButtonText}>Update Trip</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  modeContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeText: {
    marginLeft: 6,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: Colors.danger,
    marginBottom: 12,
  },
});
