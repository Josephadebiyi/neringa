import Flutter
import UIKit
import UserNotifications
import GoogleSignIn

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let pushChannelName = "bago/push_notifications"
  private var pushMethodChannel: FlutterMethodChannel?
  private var currentDeviceToken: String?
  private var pendingNotificationData: [String: String]?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    UNUserNotificationCenter.current().delegate = self
    // App launched by tapping a notification while killed
    if let remoteNotif = launchOptions?[.remoteNotification] as? [String: AnyObject],
       let conversationId = remoteNotif["conversationId"] as? String {
      pendingNotificationData = [
        "conversationId": conversationId,
        "type": remoteNotif["type"] as? String ?? "chat_message",
      ]
    }
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return GIDSignIn.sharedInstance.handle(url)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    pushMethodChannel = FlutterMethodChannel(
      name: pushChannelName,
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )
    // Deliver any notification that launched the app from killed state
    if let data = pendingNotificationData {
      pushMethodChannel?.invokeMethod("onNotificationTap", arguments: data)
      pendingNotificationData = nil
    }

    pushMethodChannel?.setMethodCallHandler { [weak self] call, result in
      guard let self else {
        result(FlutterError(code: "unavailable", message: "App delegate unavailable", details: nil))
        return
      }
      switch call.method {
      case "requestPermission":
        self.requestPushPermission(application: UIApplication.shared, result: result)
      case "getDeviceToken":
        result(self.currentDeviceToken)
      case "getPermissionStatus":
        self.getPermissionStatus(result: result)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  private func requestPushPermission(application: UIApplication, result: @escaping FlutterResult) {
    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
      DispatchQueue.main.async {
        if granted {
          application.registerForRemoteNotifications()
        }
        if let error {
          result(FlutterError(code: "permission_error", message: error.localizedDescription, details: nil))
        } else {
          result(granted)
        }
      }
    }
  }

  private func getPermissionStatus(result: @escaping FlutterResult) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      DispatchQueue.main.async {
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
          result("authorized")
        case .denied:
          result("denied")
        default:
          result("notDetermined")
        }
      }
    }
  }

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    currentDeviceToken = token
    pushMethodChannel?.invokeMethod("onDeviceToken", arguments: token)
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    pushMethodChannel?.invokeMethod("onDeviceTokenError", arguments: error.localizedDescription)
  }

  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.alert, .sound, .badge])
  }

  // User tapped a notification while app was in background or foreground
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    if let conversationId = userInfo["conversationId"] as? String {
      let data: [String: String] = [
        "conversationId": conversationId,
        "type": userInfo["type"] as? String ?? "chat_message",
      ]
      if pushMethodChannel != nil {
        pushMethodChannel?.invokeMethod("onNotificationTap", arguments: data)
      } else {
        pendingNotificationData = data
      }
    }
    completionHandler()
  }
}
