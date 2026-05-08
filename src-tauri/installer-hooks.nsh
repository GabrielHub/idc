; Wipe per-user app data on uninstall AND on upgrade (the new installer
; runs the previous uninstaller silently with /UPDATE before installing).
; In both cases we want a clean slate: alpha saves are not forward-compatible
; across builds, and leaving the plaintext Vercel Gateway key behind is a
; security gotcha. POSTUNINSTALL fires after the template's own conditional
; cleanup block, so this overrides the default "preserve unless checkbox
; ticked AND not upgrading" behavior.
!macro NSIS_HOOK_POSTUNINSTALL
  SetShellVarContext current
  RMDir /r "$LOCALAPPDATA\dev.idc.cupid"
  RMDir /r "$APPDATA\dev.idc.cupid"
!macroend
