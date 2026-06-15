import Flutter
import UIKit
import UserNotifications
import GoogleSignIn
import PayPal

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let pushChannelName = "bago/push_notifications"
  private let kycOverlayChannelName = "bago/kyc_overlay"
  private let paypalCardChannelName = "bago/paypal_card"
  private var pushMethodChannel: FlutterMethodChannel?
  private var paypalCardChannel: FlutterMethodChannel?
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
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }
    return super.application(app, open: url, options: options)
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

    // KYC overlay channel — shows Bago's branded startup screen
    let kycOverlayChannel = FlutterMethodChannel(
      name: kycOverlayChannelName,
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )
    kycOverlayChannel.setMethodCallHandler { call, result in
      switch call.method {
      case "show": DojahLoadingOverlay.show(); result(nil)
      case "hide": DojahLoadingOverlay.hide(); result(nil)
      default: result(FlutterMethodNotImplemented)
      }
    }

    paypalCardChannel = FlutterMethodChannel(
      name: paypalCardChannelName,
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )
    paypalCardChannel?.setMethodCallHandler { [weak self] call, result in
      guard call.method == "approveCardOrder" else {
        result(FlutterMethodNotImplemented)
        return
      }
      guard let args = call.arguments as? [String: Any],
            let clientId = args["clientId"] as? String,
            let orderId = args["orderId"] as? String else {
        result(FlutterError(code: "invalid_args", message: "Missing PayPal card approval arguments.", details: nil))
        return
      }
      let environment = args["environment"] as? String ?? "live"
      let amount = args["amount"] as? Double ?? 0
      let currency = args["currency"] as? String ?? "USD"
      self?.presentPayPalCardApproval(
        clientId: clientId,
        environment: environment,
        orderId: orderId,
        amount: amount,
        currency: currency,
        result: result
      )
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

  private func presentPayPalCardApproval(
    clientId: String,
    environment: String,
    orderId: String,
    amount: Double,
    currency: String,
    result: @escaping FlutterResult
  ) {
    DispatchQueue.main.async {
      guard let presenter = self.topViewController() else {
        result(FlutterError(code: "no_presenter", message: "Could not open card payment screen.", details: nil))
        return
      }
      let viewController = PayPalNativeCardViewController(
        clientId: clientId,
        environment: environment,
        orderId: orderId,
        amount: amount,
        currency: currency,
        result: result
      )
      let nav = UINavigationController(rootViewController: viewController)
      nav.modalPresentationStyle = .formSheet
      presenter.present(nav, animated: true)
    }
  }

  private func topViewController(
    base: UIViewController? = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }?.rootViewController
  ) -> UIViewController? {
    if let nav = base as? UINavigationController {
      return topViewController(base: nav.visibleViewController)
    }
    if let tab = base as? UITabBarController {
      return topViewController(base: tab.selectedViewController)
    }
    if let presented = base?.presentedViewController {
      return topViewController(base: presented)
    }
    return base
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

final class PayPalNativeCardViewController: UIViewController {
  private let clientId: String
  private let environmentName: String
  private let orderId: String
  private let amount: Double
  private let currency: String
  private let flutterResult: FlutterResult
  private var cardClient: CardClient?
  private var hasCompleted = false

  private let scrollView = UIScrollView()
  private let stackView = UIStackView()
  private let numberField = UITextField()
  private let expiryField = UITextField()
  private let cvvField = UITextField()
  private let nameField = UITextField()
  private let errorLabel = UILabel()
  private let payButton = UIButton(type: .system)

  init(
    clientId: String,
    environment: String,
    orderId: String,
    amount: Double,
    currency: String,
    result: @escaping FlutterResult
  ) {
    self.clientId = clientId
    self.environmentName = environment
    self.orderId = orderId
    self.amount = amount
    self.currency = currency
    self.flutterResult = result
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    title = "Bank card"
    view.backgroundColor = .systemBackground
    navigationItem.leftBarButtonItem = UIBarButtonItem(
      barButtonSystemItem: .close,
      target: self,
      action: #selector(closeTapped)
    )
    configurePayPal()
    buildForm()
  }

  private func configurePayPal() {
    let environment: Environment = environmentName.lowercased() == "sandbox" ? .sandbox : .live
    let coreConfig = CoreConfig(clientID: clientId, environment: environment)
    let client = CardClient(config: coreConfig)
    cardClient = client
  }

  private func buildForm() {
    scrollView.translatesAutoresizingMaskIntoConstraints = false
    stackView.translatesAutoresizingMaskIntoConstraints = false
    stackView.axis = .vertical
    stackView.spacing = 16
    view.addSubview(scrollView)
    scrollView.addSubview(stackView)

    NSLayoutConstraint.activate([
      scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
      scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      stackView.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor, constant: 24),
      stackView.leadingAnchor.constraint(equalTo: scrollView.frameLayoutGuide.leadingAnchor, constant: 24),
      stackView.trailingAnchor.constraint(equalTo: scrollView.frameLayoutGuide.trailingAnchor, constant: -24),
      stackView.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor, constant: -32),
    ])

    let titleLabel = UILabel()
    titleLabel.text = "Enter your card details"
    titleLabel.font = .systemFont(ofSize: 32, weight: .black)
    titleLabel.numberOfLines = 0

    let subtitle = UILabel()
    subtitle.text = "Pay \(currency) \(String(format: "%.2f", amount)). PayPal securely processes your card. Bago never stores card numbers or CVV."
    subtitle.textColor = .secondaryLabel
    subtitle.font = .systemFont(ofSize: 16, weight: .semibold)
    subtitle.numberOfLines = 0

    [numberField, expiryField, cvvField, nameField].forEach(styleField)
    numberField.placeholder = "Card number"
    numberField.keyboardType = .numberPad
    expiryField.placeholder = "MM/YY"
    expiryField.keyboardType = .numbersAndPunctuation
    cvvField.placeholder = "CVV"
    cvvField.keyboardType = .numberPad
    cvvField.isSecureTextEntry = true
    nameField.placeholder = "Cardholder name"
    nameField.textContentType = .name

    errorLabel.textColor = .systemRed
    errorLabel.font = .systemFont(ofSize: 14, weight: .semibold)
    errorLabel.numberOfLines = 0

    payButton.setTitle("Pay \(currency) \(String(format: "%.2f", amount))", for: .normal)
    payButton.titleLabel?.font = .systemFont(ofSize: 18, weight: .black)
    payButton.backgroundColor = UIColor(red: 0.36, green: 0.27, blue: 1.0, alpha: 1.0)
    payButton.tintColor = .white
    payButton.layer.cornerRadius = 18
    payButton.heightAnchor.constraint(equalToConstant: 58).isActive = true
    payButton.addTarget(self, action: #selector(payTapped), for: .touchUpInside)

    stackView.addArrangedSubview(titleLabel)
    stackView.addArrangedSubview(subtitle)
    stackView.addArrangedSubview(numberField)
    let row = UIStackView(arrangedSubviews: [expiryField, cvvField])
    row.axis = .horizontal
    row.spacing = 12
    row.distribution = .fillEqually
    stackView.addArrangedSubview(row)
    stackView.addArrangedSubview(nameField)
    stackView.addArrangedSubview(errorLabel)
    stackView.addArrangedSubview(payButton)
  }

  private func styleField(_ field: UITextField) {
    field.borderStyle = .none
    field.backgroundColor = .secondarySystemBackground
    field.layer.cornerRadius = 16
    field.font = .systemFont(ofSize: 17, weight: .semibold)
    field.heightAnchor.constraint(equalToConstant: 56).isActive = true
    field.leftView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 1))
    field.leftViewMode = .always
    field.rightView = UIView(frame: CGRect(x: 0, y: 0, width: 16, height: 1))
    field.rightViewMode = .always
  }

  @objc private func closeTapped() {
    completeWithError(code: "cancelled", message: "Payment was cancelled.")
    dismiss(animated: true)
  }

  @objc private func payTapped() {
    guard let cardClient else { return }
    errorLabel.text = nil
    let number = (numberField.text ?? "").filter(\.isNumber)
    let expiry = (expiryField.text ?? "").replacingOccurrences(of: " ", with: "")
    let cvv = (cvvField.text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    let name = (nameField.text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    let parts = expiry.split(separator: "/").map(String.init)

    guard number.count >= 12, parts.count == 2, !cvv.isEmpty, !name.isEmpty else {
      errorLabel.text = "Enter the card number, expiry, CVV, and cardholder name."
      return
    }

    payButton.isEnabled = false
    payButton.alpha = 0.7

    let year = parts[1].count == 2 ? "20\(parts[1])" : parts[1]
    let card = Card(
      number: number,
      expirationMonth: parts[0],
      expirationYear: year,
      securityCode: cvv,
      cardholderName: name
    )
    let request = CardRequest(orderID: orderId, card: card, sca: .scaWhenRequired)
    cardClient.approveOrder(request: request) { [weak self] result in
      DispatchQueue.main.async {
        guard let self else { return }
        self.payButton.isEnabled = true
        self.payButton.alpha = 1
        switch result {
        case .success:
          self.completeSuccessfully()
          self.dismiss(animated: true)
        case .failure(let error):
          self.errorLabel.text = error.localizedDescription
          self.completeWithError(code: "card_error", message: error.localizedDescription)
          self.dismiss(animated: true)
        }
      }
    }
  }

  private func completeWithError(code: String, message: String) {
    guard !hasCompleted else { return }
    hasCompleted = true
    flutterResult(FlutterError(code: code, message: message, details: nil))
  }

  private func completeSuccessfully() {
    guard !hasCompleted else { return }
    hasCompleted = true
    flutterResult([
      "orderId": orderId,
      "approved": true,
    ])
  }

}
