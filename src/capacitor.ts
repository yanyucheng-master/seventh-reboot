/** Capacitor integration stub. Safe to run in browser or native builds. */
export async function initCapacitor(): Promise<void> {
  // This app is primarily a web app wrapped in Capacitor.
  // Add native plugin initialization here when @capacitor/* packages are installed.
  try {
    const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (capacitor?.isNativePlatform?.()) {
      // Native-only setup (e.g., status bar, splash screen) goes here.
    }
  } catch {
    // Ignore errors on non-native platforms.
  }
}
