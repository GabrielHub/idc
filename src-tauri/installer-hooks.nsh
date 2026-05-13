!include FileFunc.nsh
!include LogicLib.nsh

!insertmacro GetParameters
!insertmacro GetOptions

; Wipe per-user app data on manual uninstall, but preserve it during updates.
; Tauri updater and the normal NSIS upgrade path run the previous uninstaller
; with /UPDATE. Save schema recovery and Gateway key storage belong to app code.
!macro NSIS_HOOK_POSTUNINSTALL
  ${GetParameters} $R0
  ${GetOptions} $R0 "/UPDATE" $R1
  ${If} ${Errors}
    SetShellVarContext current
    RMDir /r "$LOCALAPPDATA\dev.idc.cupid"
    RMDir /r "$APPDATA\dev.idc.cupid"
  ${EndIf}
!macroend
