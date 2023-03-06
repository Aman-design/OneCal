// This function is purely necessary because of react-timezone-select see
// https://github.com/spencermountain/spacetime/issues/323
// https://github.com/spencermountain/timezone-soft/issues/17
// and https://github.com/ndom91/react-timezone-select/issues/76
// for more context
function isProblematicTimezone(tz: string): boolean {
  const problematicTimezones = [
    "null",
    "Africa/Malabo",
    "Africa/Maseru",
    "Africa/Mbabane",
    "America/Anguilla",
    "America/Antigua",
    "America/Aruba",
    "America/Bahia",
    "America/Cayman",
    "America/Dominica",
    "America/Grenada",
    "America/Guadeloupe",
    "America/Kralendijk",
    "America/Lower_Princes",
    "America/Maceio",
    "America/Marigot",
    "America/Montserrat",
    "America/Nassau",
    "America/St_Barthelemy",
    "America/St_Kitts",
    "America/St_Lucia",
    "America/St_Thomas",
    "America/St_Vincent",
    "America/Tortola",
    "Antarctica/McMurdo",
    "Arctic/Longyearbyen",
    "Asia/Bahrain",
    "Atlantic/St_Helena",
    "Europe/Busingen",
    "Europe/Guernsey",
    "Europe/Isle_of_Man",
    "Europe/Mariehamn",
    "Europe/San_Marino",
    "Europe/Vaduz",
    "Europe/Vatican",
    "Indian/Comoro",
    "Pacific/Saipan",
    "Africa/Asmara",
  ];
  return problematicTimezones.includes(tz);
}
export default isProblematicTimezone;
