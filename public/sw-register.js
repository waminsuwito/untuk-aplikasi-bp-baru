if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
  const wb = new window.workbox.Workbox('/sw.js');

  // A common UX pattern for progressive web apps is to show a banner when a new version of the app is available.
  // The banner asks the user to reload the page to get the latest version.
  // This is implemented by listening for the `waiting` event.
  wb.addEventListener('waiting', () => {
    // `event.wasWaitingBeforeRegister` will be false if this is the first time the updated service worker is waiting.
    // When `event.wasWaitingBeforeRegister` is true, a previously updated service worker is still waiting.
    // You may want to customize this logic; e.g., prompt the user when `event.wasWaitingBeforeRegister` is true.
    
    // Assuming the user accepts the update, call wb.messageSkipWaiting();
    wb.messageSkipWaiting();
  });

  wb.register();
}
