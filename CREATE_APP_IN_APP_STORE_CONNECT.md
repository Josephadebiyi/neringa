# 🍎 Create Bago App in App Store Connect

## The Issue

Your iOS build is ready, but the app doesn't exist in App Store Connect yet. You need to create it first before you can submit builds.

---

## ✅ Step-by-Step: Create App in App Store Connect

### **Step 1: Go to App Store Connect**

1. Open your browser and go to:
   ```
   https://appstoreconnect.apple.com
   ```

2. **Log in** with:
   - Apple ID: `taiwojos2@gmail.com`
   - Password: `Tayelolu@1`
   - 2FA code: (from your iPhone)

---

### **Step 2: Create New App**

1. **Click "My Apps"**

2. **Click the "+" button** (top left)

3. **Select "New App"**

---

### **Step 3: Fill Out App Information**

You'll see a form with these fields:

#### **Platforms**:
- ✅ Check "iOS"

#### **Name**:
```
Bago
```

#### **Primary Language**:
```
English (U.S.)
```

#### **Bundle ID**:
- **Click the dropdown**
- **Select**: `com.deracali.boltexponativewind`
- If it's not in the list, you need to register it first (see below)

#### **SKU**:
```
com.deracali.boltexponativewind.1
```
(This is just an internal identifier - can be anything unique)

#### **User Access**:
- Select: **Full Access**

---

### **Step 4: Click "Create"**

The app will be created in App Store Connect!

---

## 🔧 If Bundle ID is Not in Dropdown

If `com.deracali.boltexponativewind` doesn't appear in the Bundle ID dropdown, you need to register it:

### **Register Bundle ID**:

1. **Go to Apple Developer Portal**:
   ```
   https://developer.apple.com/account/resources/identifiers/list
   ```

2. **Click the "+" button** to add new identifier

3. **Select "App IDs"** → Click "Continue"

4. **Select "App"** → Click "Continue"

5. **Fill out the form**:
   - **Description**: `Bago`
   - **Bundle ID**: Select "Explicit"
   - **Bundle ID value**: `com.deracali.boltexponativewind`

6. **Capabilities**: Check these:
   - ✅ Push Notifications
   - ✅ Sign in with Apple (if using Google Auth)
   - ✅ Associated Domains (if needed)

7. **Click "Continue"** → **Click "Register"**

8. **Go back to App Store Connect** and try creating the app again

---

## 📱 After Creating the App

Once the app is created in App Store Connect:

### **Option 1: Submit via Expo Dashboard** (Easiest)

1. **Go to your build**:
   ```
   https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/bf1b1bf3-6038-4c43-ab15-0ee4017ac166
   ```

2. **Click "Submit to App Store Connect"**

3. **Enter credentials** when prompted

4. **Done!**

---

### **Option 2: Submit via Command Line**

First, get your App Store Connect App ID:

1. Go to: https://appstoreconnect.apple.com
2. Click "My Apps" → "Bago"
3. Click "App Information" (left sidebar)
4. Find "Apple ID" (it's a number like `1234567890`)

Then get your Team ID:

1. Go to: https://developer.apple.com/account
2. Click "Membership"
3. Find "Team ID" (10 characters like `AB12CD34EF`)

Now submit:

```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE

# Set environment variables
export EXPO_APPLE_ID="taiwojos2@gmail.com"
export EXPO_ASC_APP_ID="1234567890"  # Replace with your actual App ID
export EXPO_APPLE_TEAM_ID="AB12CD34EF"  # Replace with your actual Team ID

# Submit build
npx eas-cli submit --platform ios --latest
```

---

## 🎯 Recommended Approach

**Use Expo Dashboard** - it's much simpler:

1. ✅ **Create app in App Store Connect** (follow steps above)
2. ✅ **Go to**: https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/bf1b1bf3-6038-4c43-ab15-0ee4017ac166
3. ✅ **Click "Submit to App Store Connect"**
4. ✅ **Enter Apple credentials**
5. ✅ **Done!**

---

## 📋 App Information to Fill Out

After creating the app, you'll need to fill out additional information before you can submit for review:

### **Required Information**:

#### **App Information**:
- **Privacy Policy URL**: (your website URL)
- **Category**: Travel or Lifestyle
- **Subcategory**: (optional)
- **Content Rights**: Check if it contains third-party content

#### **Pricing and Availability**:
- **Price**: Free
- **Countries**: Select countries where app will be available

#### **App Privacy**:
- Answer questions about data collection
- Create privacy policy

#### **Version Information** (for each version):
- **Screenshots** (required):
  - 6.7" display (iPhone 14 Pro Max): 3-10 screenshots
  - 6.5" display (iPhone 11 Pro Max): 3-10 screenshots
- **Promotional Text**: (optional)
- **Description**: Write about your app
- **Keywords**: travel, delivery, package, shipping, peer-to-peer
- **Support URL**: Your website or support email
- **Marketing URL**: (optional)

---

## 📸 Screenshot Requirements

You'll need screenshots for two iPhone sizes:

### **6.7" Display** (iPhone 14 Pro Max):
- Dimensions: **1290 x 2796** pixels
- Or: **2796 x 1290** (landscape)
- Format: PNG or JPG
- Quantity: 3-10 images

### **6.5" Display** (iPhone 11 Pro Max):
- Dimensions: **1242 x 2688** pixels
- Or: **2688 x 1242** (landscape)
- Format: PNG or JPG
- Quantity: 3-10 images

**Tip**: Use a screenshot tool or simulator to capture these. Show the best features of your app!

---

## ✅ Checklist

Before you can submit to App Store:

- [ ] App created in App Store Connect
- [ ] Bundle ID registered (`com.deracali.boltexponativewind`)
- [ ] App Information filled out
- [ ] Privacy Policy created and URL added
- [ ] Screenshots prepared (6.7" and 6.5")
- [ ] App description written
- [ ] Keywords added
- [ ] Support URL added
- [ ] Pricing set to Free
- [ ] Countries selected
- [ ] Privacy questions answered
- [ ] Build uploaded (Build #25)

---

## 🚀 Quick Start

**Right now, do this**:

1. **Go to**: https://appstoreconnect.apple.com
2. **Click "My Apps"**
3. **Click "+" → "New App"**
4. **Fill out form**:
   - Name: Bago
   - Bundle ID: com.deracali.boltexponativewind
   - SKU: com.deracali.boltexponativewind.1
5. **Click "Create"**
6. **Fill out required information** (screenshots, description, etc.)
7. **Go to Expo**: https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/bf1b1bf3-6038-4c43-ab15-0ee4017ac166
8. **Click "Submit to App Store Connect"**
9. **Done!**

---

## 💡 Why This Happened

EAS CLI tried to submit to an app that doesn't exist yet in App Store Connect. You need to create the app record first, then attach builds to it.

This is a one-time setup. After the app is created, future builds can be submitted directly!

---

**Start here**: https://appstoreconnect.apple.com

Create the app, then submit Build #25! 🚀
