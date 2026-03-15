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
  KeyboardAvoidingView,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import { Image } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import { MapPin, Calendar, Weight, Plane, Bus, Train, Car, Ship, MoreHorizontal, ChevronLeft, Package, DollarSign, Upload, Shield, Ticket as TicketIcon } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { backendomain } from "@/utils/backendDomain";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RAPID_API_KEY = "764ae3a2d0msh0d44a93e665c289p104415jsn9a0e1853cc6e";

export default function AddTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fromCountry, setFromCountry] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCountry, setToCountry] = useState("");
  const [toCity, setToCity] = useState("");
  const [availableKg, setAvailableKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [currency, setCurrency] = useState("USD"); // Default currency
  const [travelMeans, settravelMeans] = useState(""); // "Air" or "Land"
  const [departureDate, setDepartureDate] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [arrivalDate, setArrivalDate] = useState("");
  const [landmark, setLandmark] = useState("");
  const [travelDocument, setTravelDocument] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isArrivalDatePickerVisible, setArrivalDatePickerVisibility] = useState(false);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [hasPreferredCurrency, setHasPreferredCurrency] = useState(true); // Default to true until checked
  const [showCurrencyModalAlert, setShowCurrencyModalAlert] = useState(false);


  // --- Modal State ---
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectingField, setSelectingField] = useState(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => {
    fetchCountries();
    checkKycStatus();
    fetchUserCurrency();
  }, []);

  const pickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need access to your gallery to upload the ticket.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setTravelDocument(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const fetchUserCurrency = async () => {
    try {
      const response = await axios.get(`${backendomain.backendomain}/api/bago/me`, { withCredentials: true });
      if (response.data?.user?.preferredCurrency) {
        setCurrency(response.data.user.preferredCurrency);
      }
    } catch (err) {
      console.log("Failed to fetch user currency");
    }
  };

  // replace your current checkKycStatus function with this
  const checkKycStatus = async () => {
    try {
      const res = await axios.get(`${backendomain.backendomain}/api/bago/Profile`, {
        withCredentials: true,
      });

      const user = res.data?.data?.findUser;
      console.log("AddTrip: fetched profile data:", {
        kycStatus: user?.kycStatus,
        status: user?.status,
        preferredCurrency: user?.preferredCurrency
      });

      // Check KYC
      const isVerified = user?.kycStatus === 'approved' || user?.status === 'verified';
      setIsKycVerified(isVerified);

      // Check Currency
      setHasPreferredCurrency(!!user?.preferredCurrency);
    } catch (err) {
      console.error("AddTrip: error checking profile:", err);
      setIsKycVerified(false);
      setHasPreferredCurrency(false);
    }
  };


  const fetchCountries = async () => {
    try {
      const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,flags");
      const formatted = res.data
        .map((c: any) => ({
          name: c?.name?.common || "",
          flag: c?.flags?.png || null,
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setCountries(formatted);
    } catch {
      Alert.alert("Error", "Could not fetch countries");
    }
  };

  const fetchCities = async (countryName: string) => {
    try {
      setLoadingCities(true);

      // Get ISO2 code
      const codeRes = await axios.get(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true&fields=cca2`
      );

      const countryCode = codeRes.data?.[0]?.cca2?.toUpperCase();
      if (!countryCode) {
        console.warn('No ISO code found for', countryName);
        return [];
      }

      // Fetch cities
      const response = await axios.get(
        `https://wft-geo-db.p.rapidapi.com/v1/geo/cities`,
        {
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
          },
          params: {
            countryIds: countryCode,
            limit: 10,
            sort: '-population',
          },
        }
      );

      const cityList = response.data?.data?.map((c: any) => c.name) || [];
      if (cityList.length === 0) {
        console.warn(`No cities found for ${countryName}`);
        return [];
      }

      return cityList;
    } catch (err: any) {
      console.error('City fetch error:', err?.response?.status, err?.message);

      // ✅ Handle 403 or any API limit/network failure
      if (err?.response?.status === 403) {
        console.warn('RapidAPI quota or access denied. Falling back to manual input.');
        return [];
      }

      if (err?.response?.data?.errors?.[0]?.code === 'ENTITY_NOT_FOUND') {
        console.warn('Country not found in GeoDB, fallback to manual entry.');
        return [];
      }

      return [];
    } finally {
      setLoadingCities(false);
    }
  };

  const openCountryModal = (field: string) => {
    setSelectingField(field as any);
    setCountrySearch("");
    setShowCountryModal(true);
  };
  const cityInputRef = useRef<TextInput>(null);
  useEffect(() => {
    if (cities.length === 0 && showCityModal) {
      setTimeout(() => cityInputRef.current?.focus(), 300);
    }
  }, [cities, showCityModal]);

  const openCityModal = async (field: string) => {
    const country = field === "from" ? fromCountry : toCountry;
    if (!country) {
      Alert.alert("Select Country First", "Please choose a country before selecting a city.");
      return;
    }
    setSelectingField(field as any);
    setShowCityModal(true);
    setLoadingCities(true);
    const cityList = await fetchCities(country);
    setCities(cityList);
    setLoadingCities(false);
  };

  const handleSelectCountry = (countryName: string) => {
    if (selectingField === "from") setFromCountry(countryName);
    if (selectingField === "to") setToCountry(countryName);
    setShowCountryModal(false);
  };

  const handleSelectCity = (cityName: string) => {
    if (selectingField === "from") setFromCity(cityName);
    if (selectingField === "to") setToCity(cityName);
    setShowCityModal(false);
  };

  const handleConfirmDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    setDepartureDate(formatted);
    // Explicitly set arrival date if it's before departure
    if (arrivalDate && new Date(arrivalDate) < date) {
      setArrivalDate(formatted);
    }
    setDatePickerVisibility(false);
  };

  const handleConfirmArrivalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    setArrivalDate(formatted);
    setArrivalDatePickerVisibility(false);
  };

  const handleSubmit = async () => {
    // 1. Validation
    if (!fromCountry || !fromCity || !toCountry || !toCity || !departureDate || !arrivalDate || !availableKg || !travelMeans || !pricePerKg || !landmark || !travelDocument) {
      setError("All fields are required, including Price, Pick up Landmark and Travel Ticket");
      Alert.alert("Error", "Please fill in all required fields and upload your ticket.");
      return;
    }

    if (!isKycVerified) {
      setShowKycModal(true);
      return;
    }

    if (!hasPreferredCurrency) {
      setShowCurrencyModalAlert(true);
      return;
    }

    setLoading(true);
    setError(""); // Clear previous errors

    // ✅ Prepare payload
    const payload = {
      fromLocation: `${fromCity}, ${fromCountry}`,
      toLocation: `${toCity}, ${toCountry}`,
      departureDate,
      arrivalDate,
      availableKg: parseFloat(availableKg),
      pricePerKg: parseFloat(pricePerKg),
      currency, // Include currency in the payload
      landmark,
      travelDocument,
      travelMeans: travelMeans.toLowerCase(),
    };

    console.log("AddTrip: Submitting payload:", payload);

    try {
      const response = await axios.post(
        `${backendomain.backendomain}/api/bago/AddAtrip`,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("AddTrip: Response received:", response.data);

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Trip created successfully!");
        router.back();
      }
    } catch (err: any) {
      console.error("AddTrip: Submission error object:", err);

      // Detailed logging
      if (err.response) {
        console.error("AddTrip: Error response data:", err.response.data);
        console.error("AddTrip: Error response status:", err.response.status);
        console.error("AddTrip: Error response headers:", err.response.headers);
      } else if (err.request) {
        console.error("AddTrip: No response received, request made:", err.request);
      } else {
        console.error("AddTrip: Axios error message:", err.message);
      }

      const errorMessage = err.response?.data?.message || "Failed to create trip. Please try again.";
      setError(errorMessage);
      Alert.alert("Submission Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Trip</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.title}>Create New Trip</Text>
          <Text style={styles.subtitle}>Share your travel plans and earn money by carrying packages</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* From Section */}
          <Text style={styles.label}>From Country</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCountryModal("from")}>
            <MapPin size={20} color={'#6B6B6B'} />
            <Text style={styles.input}>{fromCountry || "Select Country"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>From City</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCityModal("from")}>
            <MapPin size={20} color={'#6B6B6B'} />
            <Text style={styles.input}>{fromCity || "Select City"}</Text>
          </TouchableOpacity>

          {/* To Section */}
          <Text style={styles.label}>To Country</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCountryModal("to")}>
            <MapPin size={20} color={'#6B6B6B'} />
            <Text style={styles.input}>{toCountry || "Select Country"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>To City</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => openCityModal("to")}>
            <MapPin size={20} color={'#6B6B6B'} />
            <Text style={styles.input}>{toCity || "Select City"}</Text>
          </TouchableOpacity>

          {/* Travel Mode */}
          <Text style={styles.label}>Travel Method</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeContainer}
          >
            <TouchableOpacity
              style={[styles.modeButton, travelMeans === "airplane" && styles.modeButtonActive]}
              onPress={() => settravelMeans("airplane")}
            >
              <Plane size={18} color={travelMeans === "airplane" ? '#FFFFFF' : '#6B6B6B'} />
              <Text style={[styles.modeText, { color: travelMeans === "airplane" ? '#FFFFFF' : '#1A1A1A' }]}>
                Airplane
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, travelMeans === "bus" && styles.modeButtonActive]}
              onPress={() => settravelMeans("bus")}
            >
              <Bus size={18} color={travelMeans === "bus" ? '#FFFFFF' : '#6B6B6B'} />
              <Text style={[styles.modeText, { color: travelMeans === "bus" ? '#FFFFFF' : '#1A1A1A' }]}>
                Bus
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, travelMeans === "train" && styles.modeButtonActive]}
              onPress={() => settravelMeans("train")}
            >
              <Train size={18} color={travelMeans === "train" ? '#FFFFFF' : '#6B6B6B'} />
              <Text style={[styles.modeText, { color: travelMeans === "train" ? '#FFFFFF' : '#1A1A1A' }]}>
                Train
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, travelMeans === "car" && styles.modeButtonActive]}
              onPress={() => settravelMeans("car")}
            >
              <Car size={18} color={travelMeans === "car" ? '#FFFFFF' : '#6B6B6B'} />
              <Text style={[styles.modeText, { color: travelMeans === "car" ? '#FFFFFF' : '#1A1A1A' }]}>
                Car
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, travelMeans === "ship" && styles.modeButtonActive]}
              onPress={() => settravelMeans("ship")}
            >
              <Ship size={18} color={travelMeans === "ship" ? '#FFFFFF' : '#6B6B6B'} />
              <Text style={[styles.modeText, { color: travelMeans === "ship" ? '#FFFFFF' : '#1A1A1A' }]}>
                Ship
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, travelMeans === "other" && styles.modeButtonActive]}
              onPress={() => settravelMeans("other")}
            >
              <MoreHorizontal size={18} color={travelMeans === "other" ? '#FFFFFF' : '#6B6B6B'} />
              <Text style={[styles.modeText, { color: travelMeans === "other" ? '#FFFFFF' : '#1A1A1A' }]}>
                Other
              </Text>
            </TouchableOpacity>
          </ScrollView>




          {/* Date Picker */}
          <Text style={styles.label}>Departure Date</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => setDatePickerVisibility(true)}>
            <Calendar size={20} color={'#6B6B6B'} />
            <Text style={styles.input}>{departureDate || "Select Departure Date"}</Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setDatePickerVisibility(false)}
            minimumDate={new Date()}
          />

          {/* Arrival Date */}
          <Text style={styles.label}>Arrival Date</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => setArrivalDatePickerVisibility(true)}>
            <Calendar size={20} color={'#6B6B6B'} />
            <Text style={styles.input}>{arrivalDate || "Select Arrival Date"}</Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isArrivalDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmArrivalDate}
            onCancel={() => setArrivalDatePickerVisibility(false)}
            minimumDate={departureDate ? new Date(departureDate) : new Date()}
          />


          {/* Available Space */}
          <Text style={styles.label}>Available KG</Text>
          <View style={styles.inputContainer}>
            <Package size={20} color={'#6B6B6B'} />
            <TextInput
              style={styles.input}
              placeholder="e.g. 15"
              placeholderTextColor={'#9E9E9E'}
              keyboardType="numeric"
              value={availableKg}
              onChangeText={setAvailableKg}
            />
          </View>

          <Text style={styles.label}>Price per KG</Text>
          <View style={styles.inputContainer}>
            <DollarSign size={20} color={'#6B6B6B'} />
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={'#9E9E9E'}
              keyboardType="numeric"
              value={pricePerKg}
              onChangeText={setPricePerKg}
            />
          </View>

          <Text style={styles.label}>Pick up Landmark</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color={'#6B6B6B'} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Central Station..."
              placeholderTextColor={'#9E9E9E'}
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>

          <Text style={styles.label}>Travel Ticket / Boarding Pass</Text>
          <TouchableOpacity style={styles.uploadContainer} onPress={pickDocument}>
            {travelDocument ? (
              <View style={styles.previewContainer}>
                <Text style={styles.uploadText}>Ticket Uploaded ✓</Text>
                <TouchableOpacity onPress={() => setTravelDocument(null)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Upload size={24} color={'#6B6B6B'} />
                <Text style={styles.uploadPlaceholder}>Click to upload your ticket</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Shield size={16} color={'#B45309'} />
            <Text style={styles.infoText}>
              Your trip will be sent for review. Proof of travel is mandatory to ensure reliability.
            </Text>
          </View>



          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={'#FFFFFF'} />
            ) : (
              <Text style={styles.submitButtonText}>Create Trip</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Country Modal */}
        <Modal visible={showCountryModal} animationType="slide">
          <View style={styles.modalContainerModal}>
            <TextInput
              placeholder="Search country..."
              value={countrySearch}
              onChangeText={setCountrySearch}
              style={styles.searchInput}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectCountry(item.name)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {item.flag && (
                      <Image
                        source={{ uri: item.flag }}
                        style={{ width: 24, height: 16, borderRadius: 2 }}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.modalText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCountryModal(false)} // ✅ correct one
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>


          </View>
        </Modal>

        {/* City Modal */}
        <Modal visible={showCityModal} animationType="slide">
          <View style={styles.modalContainerModal}>
            {loadingCities ? (
              <ActivityIndicator size="large" color={'#5845D8'} />
            ) : cities.length > 0 ? (
              <>
                <TextInput
                  placeholder="Search city..."
                  value={citySearch}
                  onChangeText={setCitySearch}
                  style={styles.searchInput}
                />
                <FlatList
                  data={cities.filter((city) =>
                    city.toLowerCase().includes(citySearch.toLowerCase())
                  )}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => handleSelectCity(item)}
                    >
                      <Text style={styles.modalText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={
                    <TouchableOpacity
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: '#E8B86D',
                        alignItems: "center",
                      }}
                      onPress={() => setCities([])} // switch to manual entry
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        Can't find my city?
                      </Text>
                    </TouchableOpacity>
                  }
                />
              </>
            ) : (
              // 🧠 Manual entry when city list empty
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.modalText, { marginBottom: 8 }]}>
                  Enter your city manually
                </Text>
                <TextInput
                  ref={cityInputRef}
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: '#FFFFFF',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#E5E5E5',
                    },
                  ]}
                  placeholder="Type your city name..."
                  placeholderTextColor={'#9E9E9E'}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    backgroundColor: '#5845D8',
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    if (selectingField === "from") setFromCity(citySearch.trim());
                    else if (selectingField === "to") setToCity(citySearch.trim());
                    setShowCityModal(false);
                    setSelectingField(null);
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Use this city</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCityModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>

          </View>
        </Modal>

        {/* KYC Modal */}
        <Modal
          visible={showKycModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowKycModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerKyc}>
              <Text style={styles.modalTitle}>KYC Verification Required</Text>
              <Text style={styles.modalMessage}>
                You need to verify your identity before creating a trip.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowKycModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalVerifyButton]}
                  onPress={() => {
                    setShowKycModal(false);
                    router.push("/kyc-verification"); // or "/kyc-verification" depending on your route
                  }}
                >
                  <Text style={styles.modalVerifyText}>Go to KYC</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Currency Alert Modal */}
        <Modal
          visible={showCurrencyModalAlert}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyModalAlert(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerKyc}>
              <View style={styles.currencyIconContainer}>
                <DollarSign size={40} color={'#5845D8'} />
              </View>
              <Text style={styles.modalTitle}>Set Wallet Currency</Text>
              <Text style={styles.modalMessage}>
                Please set your wallet receiving currency in your profile settings before posting a trip. This determines how you get paid.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowCurrencyModalAlert(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalVerifyButton]}
                  onPress={() => {
                    setShowCurrencyModalAlert(false);
                    router.push("/personal-details");
                  }}
                >
                  <Text style={styles.modalVerifyText}>Set Currency</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F3' },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'ios' ? 60 : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: { width: 40 },
  backIcon: { fontSize: 24 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 6 },
  subtitle: { color: '#6B6B6B', marginBottom: 24 },
  label: { fontWeight: "600", color: '#1A1A1A', marginTop: 18, marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  modeContainer: { flexDirection: "row", gap: 12 },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modeButtonActive: { backgroundColor: '#5845D8', borderColor: '#5845D8' },
  modeText: { marginLeft: 8, fontWeight: "500" },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#5845D8',
    justifyContent: "center",
    alignItems: "center",
  },

  submitButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: '#F44336', textAlign: "center", marginVertical: 8 },
  modalContainerModal: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F6F3',
    paddingTop: 50, // 👈 pushes the modal content down
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  searchInput: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  modalText: { fontSize: 16 },
  closeButton: {
    backgroundColor: '#5845D8', // 💜 button background
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    alignSelf: "center", // centers the button in modal
    width: "50%", // optional, can adjust
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainerKyc: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 5,
  },
  currencyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#EEF2FF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: "#f1f1f1",
  },
  modalVerifyButton: {
    backgroundColor: '#5845D8',
  },
  modalCancelText: {
    color: "#333",
    fontWeight: "600",
  },
  modalVerifyText: {
    color: "#fff",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    fontWeight: '500',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E5E5',
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
    gap: 12,
  },
  uploadPlaceholder: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadText: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  removeText: {
    color: '#EF4444',
    textDecorationLine: 'underline',
    fontSize: 12,
  },
});
const modalStyles = {
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#5240E8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
};
