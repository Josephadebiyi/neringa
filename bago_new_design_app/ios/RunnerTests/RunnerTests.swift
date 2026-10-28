import Flutter
import UIKit
import XCTest
@testable import stripe_ios

class RunnerTests: XCTestCase {

  func testStripeRejectsPreviousCardButtonTheme() {
    let appearance: NSDictionary = [
      "primaryButton": ["colors": ["light": ["background": "#5C4BFD"]]],
    ]
    XCTAssertThrowsError(try PaymentSheetAppearance.buildAppearanceFromParams(userParams: appearance))
  }

  func testStripeAcceptsCardButtonThemeInBothDisplayModes() throws {
    let appearance: NSDictionary = [
      "primaryButton": ["colors": [
        "light": ["background": "#5C4BFD"],
        "dark": ["background": "#5C4BFD"],
      ]],
    ]
    let configuration = try PaymentSheetAppearance.buildAppearanceFromParams(userParams: appearance)
    let color = try XCTUnwrap(configuration.primaryButton.backgroundColor)
    let expected = UIColor(red: 92.0 / 255, green: 75.0 / 255, blue: 253.0 / 255, alpha: 1)
    for style in [UIUserInterfaceStyle.light, .dark] {
      XCTAssertEqual(color.resolvedColor(with: UITraitCollection(userInterfaceStyle: style)), expected)
    }
  }

}
