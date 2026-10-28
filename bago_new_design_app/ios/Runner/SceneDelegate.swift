import Flutter
import UIKit

class SceneDelegate: FlutterSceneDelegate {
  // Under the scene lifecycle the window lives here, so the app delegate's
  // window stays nil. flutter_stripe presents its card PaymentSheet from
  // UIApplication.shared.delegate.window, and without a window the sheet
  // never appears. Mirror the scene's window onto the app delegate.
  override var window: UIWindow? {
    didSet {
      (UIApplication.shared.delegate as? FlutterAppDelegate)?.window = window
    }
  }
}
