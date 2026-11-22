import ManagedSettings
import ManagedSettingsUI
import UIKit

private enum MPM {
    static let appGroup = "group.com.flicktek.muslimpromax"
    static let honorModeKey = "mpm.honorMode"
    static let activeWindowKey = "mpm.activeWindow"
    static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }
}

/// Builds the UI drawn over a blocked app. NOTE Apple's hard limits: you may set
/// only title, subtitle, icon, and up to two buttons — no custom SwiftUI, and the
/// extension is memory-capped. Rich interventions (quiz, Quran, camera Proof Mode)
/// run in the HOST app, not here.
final class SalahShieldConfig: ShieldConfigurationDataSource {
    private func config() -> ShieldConfiguration {
        let honor = MPM.defaults.object(forKey: MPM.honorModeKey) as? Bool ?? true
        let window = (MPM.defaults.string(forKey: MPM.activeWindowKey) ?? "").capitalized
        let title = window.isEmpty ? "Pause for Salah" : "It's time for \(window)"

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.04, green: 0.09, blue: 0.08, alpha: 1),
            icon: UIImage(named: "ShieldLantern"),
            title: .init(text: title, color: .white),
            subtitle: .init(
                text: honor
                    ? "Step away and pray. Tap “I prayed” when you return."
                    : "Open MuslimProMax and scan your prayer spot to unlock.",
                color: UIColor(white: 1, alpha: 0.75)
            ),
            primaryButtonLabel: .init(
                text: honor ? "I prayed" : "Verify in app",
                color: UIColor(red: 0.04, green: 0.09, blue: 0.08, alpha: 1)
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.42, green: 0.78, blue: 0.62, alpha: 1),
            secondaryButtonLabel: .init(text: "A moment of dhikr", color: .white)
        )
    }

    override func configuration(shielding application: Application) -> ShieldConfiguration { config() }
    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration { config() }
    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration { config() }
    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration { config() }
}
