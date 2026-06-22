function emergencyResetPin() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('ADMIN_PIN', '0000');
  console.log('PIN has been successfully reset to 0000');
}
