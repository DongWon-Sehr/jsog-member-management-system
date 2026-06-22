/**
 * Composable to interact with Google Apps Script server functions
 */
export function useGas() {
  /**
   * Executes a GAS function and returns a Promise
   * @param {string} functionName - Name of the function to call in Api.js
   * @param {...any} args - Arguments to pass to the function
   */
  const call = (functionName, ...args) => {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.script || !google.script.run) {
        console.warn(`GAS environment not detected. Mocking call to ${functionName}`);
        // Mock data for local development
        setTimeout(() => resolve({ success: true, data: [], message: 'Mocked Response' }), 500);
        return;
      }

      google.script.run
        .withSuccessHandler((response) => {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response ? response.message : 'Unknown server error'));
          }
        })
        .withFailureHandler((error) => {
          reject(error);
        })[functionName](...args);
    });
  };

  return {
    call
  };
}
