import UIKit

/// Full-screen white overlay that sits above the Dojah modal window,
/// hiding the native Dojah startup screen from users.
/// Auto-dismisses after a timeout so the actual verification UI appears.
class DojahLoadingOverlay {

    private static var overlayWindow: UIWindow?
    private static var dismissTimer: DispatchWorkItem?

    static func show() {
        DispatchQueue.main.async {
            guard overlayWindow == nil else { return }

            guard
                let scene = UIApplication.shared.connectedScenes
                    .filter({ $0.activationState == .foregroundActive })
                    .compactMap({ $0 as? UIWindowScene })
                    .first
            else { return }

            let window = UIWindow(windowScene: scene)
            window.windowLevel = UIWindow.Level.alert + 100
            window.backgroundColor = .white
            window.rootViewController = OverlayViewController()
            // Keep Flutter's window as the key window so the Dojah SDK presents
            // from the real app root, not from this temporary loading overlay.
            window.isHidden = false
            overlayWindow = window

            // Dismiss automatically — by this time Dojah's real UI has loaded.
            // Keep this long enough to cover Dojah's own init screen on slow
            // mobile networks, but short enough to avoid masking a problem.
            let item = DispatchWorkItem { hide() }
            dismissTimer = item
            DispatchQueue.main.asyncAfter(deadline: .now() + 7.0, execute: item)
        }
    }

    static func hide() {
        DispatchQueue.main.async {
            dismissTimer?.cancel()
            dismissTimer = nil
            UIView.animate(withDuration: 0.25, animations: {
                overlayWindow?.alpha = 0
            }, completion: { _ in
                overlayWindow?.isHidden = true
                overlayWindow = nil
            })
        }
    }
}

private class OverlayViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white

        let bagoColor = UIColor(red: 0.361, green: 0.294, blue: 0.992, alpha: 1.0)

        let spinner = UIActivityIndicatorView(style: .large)
        spinner.color = bagoColor
        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.startAnimating()

        let label = UILabel()
        label.text = "Starting KYC"
        label.textColor = bagoColor
        label.font = UIFont.systemFont(ofSize: 15, weight: .medium)
        label.translatesAutoresizingMaskIntoConstraints = false

        let stack = UIStackView(arrangedSubviews: [spinner, label])
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 14
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    // Prevent status-bar flicker
    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }
}
