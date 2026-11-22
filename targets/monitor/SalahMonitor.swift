import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

// Shared constants (kept identical across app + all extensions).
enum MPM {
    static let appGroup = "group.com.flicktek.muslimpromax"
    static let selectionKey = "mpm.familySelection"   // encoded FamilyActivitySelection
    static let bypassKey = "mpm.count.bypass"
    static let resistKey = "mpm.count.resist"
    static let blockedSecondsKey = "mpm.blockedSeconds"
    static let honorModeKey = "mpm.honorMode"         // true = tap-to-pray unblocks; false = Proof Mode
    static let activeWindowKey = "mpm.activeWindow"    // e.g. "fajr" or "" when idle

    static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroup) ?? .standard
    }

    /// The FamilyActivitySelection the user picked, decoded from the app group.
    static func loadSelection() -> FamilyActivitySelection? {
        guard let data = defaults.data(forKey: selectionKey) else { return nil }
        return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }
}

// A single named store so every target shields/clears the SAME set.
extension ManagedSettingsStore.Name {
    static let salah = Self("salah")
}

/// The system wakes this extension at the start/end of each salah window.
final class SalahMonitor: DeviceActivityMonitor {
    private let store = ManagedSettingsStore(named: .salah)

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        guard let selection = MPM.loadSelection() else { return }

        store.shield.applications =
            selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories =
            selection.categoryTokens.isEmpty
            ? nil
            : .specific(selection.categoryTokens)
        store.shield.webDomains =
            selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens

        MPM.defaults.set(activity.rawValue, forKey: MPM.activeWindowKey)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        // Clear everything so apps unlock the instant the window closes.
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        MPM.defaults.set("", forKey: MPM.activeWindowKey)
    }
}
