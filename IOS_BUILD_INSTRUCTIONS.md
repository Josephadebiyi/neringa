# 🚀 iOS Build Instructions - Step by Step

## 📋 You Need to Run This Build Yourself

Because the build process requires **interactive terminal input** for Apple credentials, you'll need to run this in your own Terminal app.

---

## ✅ Step-by-Step Instructions

### **Step 1: Open Terminal**

1. Press `Cmd + Space` to open Spotlight
2. Type "Terminal" and press Enter

### **Step 2: Navigate to Mobile App Folder**

```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE
```

### **Step 3: Start the Build**

```bash
npx eas-cli build --platform ios --profile production
```

### **Step 4: Answer the Prompts**

When you see prompts, answer as follows:

#### **Prompt 1: "Do you want to log in to your Apple account?"**
```
Answer: y (press Enter)
```

#### **Prompt 2: "Apple ID"**
```
Enter: taiwojos2@gmail.com
Press Enter
```

#### **Prompt 3: "Password"**
```
Enter: Tayelolu@1
Press Enter
```

#### **Prompt 4: If asked about 2FA (Two-Factor Authentication)**
```
Enter the 6-digit code from your iPhone/trusted device
Press Enter
```

#### **Prompt 5: "Generate a new Apple Distribution Certificate?"**
```
Answer: Y (yes)
Press Enter
```

#### **Prompt 6: "Generate a new Apple Provisioning Profile?"**
```
Answer: Y (yes)
Press Enter
```

### **Step 5: Wait for Build to Complete**

You'll see:
```
✔ Build queued
✔ Build in progress...
```

This takes approximately **10-15 minutes**.

You'll see a link like:
```
https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds/xxxxx
```

You can click this to watch the build progress in your browser.

### **Step 6: When Build Completes**

You'll see:
```
✔ Build finished successfully
Application Archive URL: https://expo.dev/artifacts/eas/xxxxx.ipa
```

### **Step 7: Submit to App Store Connect**

After the build completes, run:
```bash
npx eas-cli submit --platform ios --latest
```

This will upload the build to App Store Connect.

---

## 🎯 Expected Build Number

Based on the auto-increment, your new build will be:
- **Version**: 1.0.0
- **Build Number**: 5 (or higher)

This is higher than the existing build #8, so it will upload successfully to App Store Connect.

---

## 📝 Full Command Sequence

Copy and paste these commands one by one:

```bash
# 1. Navigate to project
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE

# 2. Start build (will prompt for Apple credentials)
npx eas-cli build --platform ios --profile production

# Enter credentials when prompted:
# - Apple ID: taiwojos2@gmail.com
# - Password: Tayelolu@1
# - 2FA code: (from your iPhone)
# - Generate certificates: Y
# - Generate provisioning profile: Y

# 3. Wait for build to complete (~10-15 minutes)

# 4. After build finishes, submit to App Store:
npx eas-cli submit --platform ios --latest
```

---

## ⚠️ Important Notes

### **Security**:
- Never share your Apple credentials in public channels
- The credentials are used only to generate distribution certificates
- EAS stores encrypted credentials securely on Expo servers

### **Two-Factor Authentication**:
If you have 2FA enabled (which you should), you'll need:
1. Your iPhone or trusted device nearby
2. To enter the 6-digit code when prompted

### **First-Time Setup**:
Since this might be your first time building with your Apple account, EAS will:
1. Log in to your Apple Developer account
2. Generate a Distribution Certificate
3. Generate a Provisioning Profile
4. Store these securely for future builds

---

## 🔍 Troubleshooting

### **Error: "Invalid credentials"**
- Double-check the email: `taiwojos2@gmail.com`
- Double-check the password: `Tayelolu@1`
- Make sure caps lock is OFF

### **Error: "Account needs to agree to terms"**
- Go to https://developer.apple.com
- Log in with your Apple ID
- Accept any pending agreements

### **Error: "No Apple Developer membership"**
- You need an active Apple Developer account ($99/year)
- Sign up at https://developer.apple.com/programs/

### **Build stuck or taking too long**
- Builds typically take 10-15 minutes
- You can monitor progress at the URL shown
- If stuck for >30 minutes, cancel and retry:
  ```bash
  npx eas-cli build:cancel
  npx eas-cli build --platform ios --profile production
  ```

---

## 📱 After Submission

Once submitted to App Store Connect:

1. **Go to App Store Connect**:
   https://appstoreconnect.apple.com

2. **Select your app "Bago"**

3. **Click "TestFlight" tab**

4. **Wait for processing** (~5-10 minutes)

5. **Invite testers**:
   - Click "Internal Testing" or "External Testing"
   - Add tester emails
   - Testers receive invite to download TestFlight

6. **Test the app**:
   - Install TestFlight app on iPhone
   - Accept invite
   - Download and test "Bago"

7. **When ready, submit to App Store**:
   - Click "App Store" tab
   - Fill in app information
   - Add screenshots
   - Submit for review

---

## ✅ Quick Checklist

Before you start:
- [ ] Terminal app open
- [ ] Apple ID ready: `taiwojos2@gmail.com`
- [ ] Password ready: `Tayelolu@1`
- [ ] iPhone nearby (for 2FA code)
- [ ] Active Apple Developer account
- [ ] Internet connection stable

---

## 🎊 Success Indicators

### **Build Started Successfully**:
```
✔ Incremented buildNumber from 4 to 5
✔ Using remote iOS credentials
✔ Build queued
```

### **Build Completed Successfully**:
```
✔ Build finished
Build ID: xxxxx-xxxxx-xxxxx
Build number: 5
Version: 1.0.0
Download: https://expo.dev/artifacts/eas/xxxxx.ipa
```

### **Submission Successful**:
```
✔ Submitted to App Store Connect
Build: 1.0.0 (5)
Status: Processing for TestFlight
```

---

## 📞 Need Help?

### **Check build status anytime**:
```bash
npx eas-cli build:list
```

### **View specific build**:
```bash
npx eas-cli build:view BUILD_ID
```

### **Watch build in browser**:
Click the URL shown when build starts, or go to:
https://expo.dev/accounts/donnyace/projects/bolt-expo-nativewind/builds

---

## 🚀 Let's Do This!

**Open your Terminal now and run:**

```bash
cd /Users/j/Desktop/CLAUDE/BAGO/neringa/BAGO_MOBILE
npx eas-cli build --platform ios --profile production
```

Then follow the prompts using the credentials above!

Good luck! 🍀

---

**Note**: The build process is automated once you enter the credentials. EAS handles everything from there - code compilation, certificate management, and .ipa file generation. You just need to provide your Apple credentials when prompted.
