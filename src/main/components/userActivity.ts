import ActiveWindow from '@paymoapp/active-window';

 
export function getActiveWindowActivity() {
  try {
    // Initialize once
    ActiveWindow.initialize();

    // Request permissions (only needed on macOS)
    // const hasPermission = ActiveWindow.requestPermissions?.();
    // if (hasPermission === false) {
    //   console.warn(
    //     '[ActiveWindow] Screen recording permission is required. ' +
    //     'Please grant it in System Preferences → Security & Privacy → Screen Recording.'
    //   );
    //   return null;
    // }

    // Get the active window info
    const win = ActiveWindow.getActiveWindow();

    if (!win) {
      console.warn('[ActiveWindow] No active window detected.');
      return null;
    }

    // Return a cleaned-up object
    return {
      title: win.title,
      application: win.application,
       
       
      
    };
  } catch (err) {
    console.error('[ActiveWindow] Failed to get active window:', err);
    return null;
  }
}
