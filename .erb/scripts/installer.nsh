!macro customRemoveFiles
    RMDir /r /REBOOTOK "$INSTDIR\locales"
    RMDir /r /REBOOTOK "$INSTDIR\resources"
    Delete /REBOOTOK "$INSTDIR\*"
!macroend
