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
  Platform,
} from "react-native";
import { Image } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import { MapPin, Calendar, Weight, Plane, Bus, Train, Car, Ship, MoreHorizontal, ChevronLeft, Trash2 } from "lucide-react-native";
import { backendomain } from "@/utils/backendDomain";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from '@/contexts/ThemeContext';

const RAPID_API_KEY = "764ae3a2d0msh0d44a93e665c289p104415jsn9a0e1853cc6e";

export default function EditTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = params.id;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [hasActiveRequests, setHasActiveRequests] = useState(false);

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

  // Modal state
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
    checkActiveRequests();
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
      setDepartureDate(trip.departureDate);
      setArrivalDate(trip.arrivalDate);
    } catch (err) {
      console.error("Fetch trip error:", err);
      Alert.alert("Error", "Failed to fetch trip data");
    } finally {
      setLoading(false);
    }
  };

  const checkActiveRequests = async () => {
    try {
      const res = await axios.get(`${backendomain.backendomain}/api/baggo/traveler/requests`, {
        withCredentials: true,
      });
      const requests = res.data?.requests || [];
      const activeForTrip = requests.filter(
        (r) => r.tripId === tripId && ['pending', 'accepted', 'in_transit'].includes(r.status?.toLowerCase())
      );
      setHasActiveRequests(activeForTrip.length > 0);
    } catch (err) {
      console.error("Check requests error:", err);
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

  const handleConfirmArrivalDate = (date) => {
    setArrivalDate(date.toISOString().split("T")[0]);
    setArrivalDatePickerVisibility(false);
  };

  const handleUpdate = async () => {
    if (!fromCountry || !fromCity || !toCountry || !toCity || !departureDate || !arrivalDate || !availableKg || !travelMeans) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await axios.put(
        `${backendomain.backendomain}/api/baggo/Trip/${tripId}`,
        {
          fromLocation: `${fromCity}, ${fromCountry}`,
          toLocation: `${toCity}, ${toCountry}`,
          departureDate,
          arrivalDate,
          availableKg: parseFloat(availableKg),
          travelMeans,
          pricePerKg: parseFloat(pricePerKg) || 0,
        },
        { withCredentials: true }
      );
      Alert.alert("Success", "Trip updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to update trip");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (hasActiveRequests) {
      Alert.alert(
        "Cannot Delete",
        "This trip has active requests. Please complete or cancel all requests before deleting.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await axios.delete(`${backendomain.backendomain}/api/baggo/Trip/${tripId}`, {
                withCredentials: true,
              });
              Alert.alert("Success", "Trip deleted successfully", [
                { text: "OK", onPress: () => router.replace('/traveler-dashboard') }
              ]);
            } catch (err) {
              console.error("Delete error:", err);
              Alert.alert("Error", err?.response?.data?.message || "Failed to delete trip");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const travelModes = [
    { id: "flight", icon: Plane, label: "Flight" },
    { id: "bus", icon: Bus, label: "Bus" },
    { id: "train", icon: Train, label: "Train" },
    { id: "car", icon: Car, label: "Car" },
    { id: "ship", icon: Ship, label: "Ship" },
    { id: "other", icon: MoreHorizontal, label: "Other" },
  ];

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={'#5845D8'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={'#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Trip</Text>
        <TouchableOpacity 
          onPress={handleDelete} 
          style={[styles.deleteButton, hasActiveRequests && styles.deleteButtonDisabled]}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Trash2 size={20} color={hasActiveRequests ? "#CCC" : "#EF4444"} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* From Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCountryModal("from")}>
            <MapPin size={20} color={'#1A1A1A'Light} />
            <Text style={[styles.inputText, !fromCountry && styles.placeholder]}>
              {fromCountry || "Select Country"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCityModal("from")}>
            <MapPin size={20} color={'#1A1A1A'Light} />
            <Text style={[styles.inputText, !fromCity && styles.placeholder]}>
              {fromCity || "Select City"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* To Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCountryModal("to")}>
            <MapPin size={20} color={'#1A1A1A'Light} />
            <Text style={[styles.inputText, !toCountry && styles.placeholder]}>
              {toCountry || "Select Country"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCityModal("to")}>
            <MapPin size={20} color={'#1A1A1A'Light} />
            <Text style={[styles.inputText, !toCity && styles.placeholder]}>
              {toCity || "Select City"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Dates</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => setDatePickerVisibility(true)}>
            <Calendar size={20} color={'#1A1A1A'Light} />
            <Text style={[styles.inputText, !departureDate && styles.placeholder]}>
              {departureDate ? formatDate(departureDate) : "Departure Date"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputContainer} onPress={() => setArrivalDatePickerVisibility(true)}>
            <Calendar size={20} color={'#1A1A1A'Light} />
            <Text style={[styles.inputText, !arrivalDate && styles.placeholder]}>
              {arrivalDate ? formatDate(arrivalDate) : "Arrival Date"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Travel Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Mode</Text>
          <View style={styles.modeGrid}>
            {travelModes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = travelMeans === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.modeCard, isSelected && styles.modeCardSelected]}
                  onPress={() => setTravelMeans(mode.id)}
                >
                  <Icon size={24} color={isSelected ? '#5845D8' : '#1A1A1A'Light} />
                  <Text style={[styles.modeLabel, isSelected && styles.modeLabelSelected]}>{mode.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Capacity & Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capacity & Pricing</Text>
          <View style={styles.inputContainer}>
            <Weight size={20} color={'#1A1A1A'Light} />
            <TextInput
              style={styles.textInput}
              placeholder="Available KG"
              placeholderTextColor={'#1A1A1A'Muted}
              keyboardType="decimal-pad"
              value={availableKg}
              onChangeText={setAvailableKg}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.currencyIcon}>$</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Price per KG"
              placeholderTextColor={'#1A1A1A'Muted}
              keyboardType="decimal-pad"
              value={pricePerKg}
              onChangeText={setPricePerKg}
            />
            <Text style={styles.unit}>/kg</Text>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={'#FFFFFF'} />
          ) : (
            <Text style={styles.updateButtonText}>Update Trip</Text>
          )}
        </TouchableOpacity>

        {/* Delete Info */}
        {hasActiveRequests && (
          <Text style={styles.deleteInfo}>
            This trip cannot be deleted because it has active requests.
          </Text>
        )}
      </ScrollView>

      {/* Country Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 10 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search country..."
              placeholderTextColor={'#1A1A1A'Muted}
              value={countrySearch}
              onChangeText={setCountrySearch}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={() => handleSelectCountry(item.name)}>
                  {item.flag && <Image source={{ uri: item.flag }} style={styles.flag} />}
                  <Text style={styles.listItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* City Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 10 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search or type city..."
              placeholderTextColor={'#1A1A1A'Muted}
              value={citySearch}
              onChangeText={setCitySearch}
              ref={cityInputRef}
            />
            {loadingCities ? (
              <ActivityIndicator size="large" color={'#5845D8'} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={filteredCities}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => handleSelectCity(item)}>
                    <Text style={styles.listItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => {
                      if (citySearch.trim()) handleSelectCity(citySearch.trim());
                    }}
                  >
                    <Text style={styles.listItemText}>Use "{citySearch}" as city</Text>
                  </TouchableOpacity>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isArrivalDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmArrivalDate}
        onCancel={() => setArrivalDatePickerVisibility(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F6F3',
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: '#1A1A1A',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  placeholder: {
    color: '#1A1A1A'Muted,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  unit: {
    fontSize: 14,
    color: '#1A1A1A'Light,
    marginLeft: 8,
  },
  currencyIcon: {
    fontSize: 18,
    color: '#1A1A1A'Light,
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modeCard: {
    width: "30%",
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modeCardSelected: {
    borderColor: '#5845D8',
    backgroundColor: `${'#5845D8'}10`,
  },
  modeLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#1A1A1A'Light,
  },
  modeLabelSelected: {
    color: '#5845D8',
    fontWeight: "600",
  },
  updateButton: {
    backgroundColor: '#5845D8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: "600",
  },
  deleteInfo: {
    textAlign: "center",
    color: '#1A1A1A'Muted,
    fontSize: 12,
    marginTop: 12,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: '#1A1A1A',
  },
  modalClose: {
    fontSize: 16,
    color: '#5845D8',
  },
  searchInput: {
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  listItemText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  flag: {
    width: 24,
    height: 16,
    borderRadius: 2,
  },
});
