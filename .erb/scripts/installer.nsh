!include LogicLib.nsh

!macro customRemoveFiles
    ${if} ${isUpdated}
        CreateDirectory "$PLUGINSDIR\old-install"

        Push ""
        Call un.atomicRMDir
        Pop $R0

        ${if} $R0 != 0
            DetailPrint "File is busy, aborting: $R0"

            # Attempt to restore previous directory
            Push ""
            Call un.restoreFiles
            Pop $R0

            Abort `Can't rename "$INSTDIR" to "$PLUGINSDIR\old-install".`
        ${endif}
    ${endif}

    RMDir /r /REBOOTOK "$INSTDIR\locales"
    RMDir /r /REBOOTOK "$INSTDIR\resources"
    Delete /REBOOTOK "$INSTDIR\*"
!macroend
