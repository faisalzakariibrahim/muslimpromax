import ManagedSettings
import Foundation

private enum MPM {
    static let appGroup = "group.com.flicktek.muslimpromax"
    static let honorModeKey = "mpm.honorMode"
    static let resistKey = "mpm.count.resist"
    static let bypassKey = "mpm.count.bypass"
    static let prayedPendingKey = "mpm.prayedPending"   // host app reads this to credit the prayer
    static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }
    static func bump(_ key: String) { defaults.set(defaults.integer(forKey: key) + 1, forKey: key) }
}

extension ManagedSettingsStore.Name { static let salah = Self("salah") }

/// Decides what a shield button does. The Shield Action extension is one of the
/// few places allowed to MUTATE the ManagedSettingsStore, so "Honor mode" can
/// unblock instantly here without round-tripping through the host app.
final class SalahShieldAction: ShieldActionDelegate {
    private let store = ManagedSettingsStore(named: .salah)

    override func handle(
        action: ShieldAction,
        for application: ApplicationToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) { route(action, completionHandler) }

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomainToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) { route(action, completionHandler) }

    override func handle(
        action: ShieldAction,
        for category: ActivityCategoryToken,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) { route(action, completionHandler) }

    private func route(
        _ action: ShieldAction,
        _ done: @escaping (ShieldActionResponse) -> Void
    ) {
        let honor = MPM.defaults.object(forKey: MPM.honorModeKey) as? Bool ?? true

        switch action {
        case .primaryButtonPressed:
            if honor {
                // Trust-based unlock: clear the shield now, flag the prayer so the
                // host app credits the streak + Noor score on next open.
                store.shield.applications = nil
                store.shield.applicationCategories = nil
                store.shield.webDomains = nil
                MPM.bump(MPM.resistKey)
                MPM.defaults.set(Date().timeIntervalSince1970, forKey: MPM.prayedPendingKey)
                done(.close)
            } else {
                // Proof Mode needs the camera + Claude, which can't run in an
                // extension. Send them home to open the app; keep apps blocked.
                done(.close)
            }

        case .secondaryButtonPressed:
            // "A moment of dhikr" — stay blocked, nudge toward the app.
            MPM.bump(MPM.bypassKey)
            done(.defer)

        @unknown default:
            done(.none)
        }
    }
}
