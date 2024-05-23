Function un.atomicRMDir
  Exch $R0
  Push $R1
  Push $R2
  Push $R3

  StrCpy $R3 "$INSTDIR$R0\*.*"
  FindFirst $R1 $R2 $R3

  loop:
    StrCmp $R2 "" break

    StrCmp $R2 "." continue
    StrCmp $R2 ".." continue

    IfFileExists "$INSTDIR$R0\$R2\*.*" isDir isNotDir

    isDir:
      CreateDirectory "$PLUGINSDIR\old-install$R0\$R2"

      Push "$R0\$R2"
      Call un.atomicRMDir
      Pop $R3

      ${if} $R3 != 0
        Goto done
      ${endIf}

      Goto continue

    isNotDir:
      ClearErrors
      Rename "$INSTDIR$R0\$R2" "$PLUGINSDIR\old-install$R0\$R2"

      # Ignore errors when renaming ourselves.
      StrCmp "$R0\$R2" "${UNINSTALL_FILENAME}" 0 +2
      ClearErrors

      IfErrors 0 +3
      StrCpy $R3 "$INSTDIR$R0\$R2"
      Goto done

    continue:
      FindNext $R1 $R2
      Goto loop

  break:
    StrCpy $R3 0

  done:
    FindClose $R1

    StrCpy $R0 $R3

    Pop $R3
    Pop $R2
    Pop $R1
    Exch $R0
FunctionEnd


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
