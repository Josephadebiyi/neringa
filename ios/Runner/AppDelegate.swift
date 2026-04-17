import Flutter
import UIKit
import UserNotifications
import GoogleSignIn
import Firebase

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let pushChannelName = "bago/push_notifications"
  private var pushMethodChannel: FlutterMethodChannel?
  private var currentDeviceToken: String?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Must be called before super so Firebase Messaging can swizzle APNs delegates
    FirebaseApp.configure()
    UNUserNotificationCenter.current().delegate = self
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

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    currentDeviceToken = token
    pushMethodChannel?.invokeMethod("onDeviceToken", arguments: token)
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    pushMethodChannel?.invokeMethod("onDeviceTokenError", arguments: error.localizedDescription)
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }

  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.alert, .sound, .badge])
  }
}
