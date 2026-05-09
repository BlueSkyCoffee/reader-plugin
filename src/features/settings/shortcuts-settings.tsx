import { i18n } from "#imports"
import { Keyboard, RotateCcw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { SettingItem } from "@/components/settings/setting-item"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  eventToKeyCombo,
  formatKeyCombo,
  isValidKeyCombo,
  normalizeKeyCombo,
  SHORTCUT_DEFINITIONS,
  useShortcuts,
} from "@/hooks/use-shortcuts"

export function ShortcutsSettings() {
  const { shortcuts, updateShortcut, resetToDefaults } = useShortcuts()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [recordingKeys, setRecordingKeys] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const handleStartRecording = (id: string) => {
    setEditingId(id)
    setIsRecording(true)
    setRecordingKeys([])
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRecording)
      return

    event.preventDefault()
    const keys = eventToKeyCombo(event.nativeEvent)

    if (keys.length > 0) {
      setRecordingKeys(keys)
    }
  }

  const handleSaveShortcut = () => {
    if (!editingId)
      return

    if (!isValidKeyCombo(recordingKeys)) {
      toast.error(i18n.t("settings.shortcuts.toast.invalid"))
      return
    }

    const isDuplicate = shortcuts.some(
      s =>
        s.id !== editingId
        && JSON.stringify(s.keys) === JSON.stringify(recordingKeys),
    )

    if (isDuplicate) {
      toast.error(i18n.t("settings.shortcuts.toast.conflict"))
      return
    }

    updateShortcut(editingId, recordingKeys)
    toast.success(i18n.t("settings.shortcuts.toast.updated"))
    setEditingId(null)
    setIsRecording(false)
    setRecordingKeys([])
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsRecording(false)
    setRecordingKeys([])
  }

  const handleResetAll = () => {
    resetToDefaults()
    toast.success(i18n.t("settings.shortcuts.toast.reset"))
  }

  const currentShortcut = editingId
    ? shortcuts.find(s => s.id === editingId)
    : null

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Keyboard className="h-4 w-4" />
        <AlertTitle>{i18n.t("settings.shortcuts.alertTitle")}</AlertTitle>
        <AlertDescription>
          {i18n.t("settings.shortcuts.alertDesc")}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3">
        {shortcuts.map((shortcut) => {
          const definition
            = SHORTCUT_DEFINITIONS[shortcut.id as keyof typeof SHORTCUT_DEFINITIONS]

          return (
            <SettingItem
              key={shortcut.id}
              icon={<Keyboard className="size-4" />}
              title={definition?.name() || shortcut.id}
              description={definition?.description()}
            >
              <div className="flex items-center gap-2">
                <KbdGroup>
                  {normalizeKeyCombo(shortcut.keys).map((key, i) => (
                    <Kbd key={i}>{key}</Kbd>
                  ))}
                </KbdGroup>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartRecording(shortcut.id)}
                >
                  {i18n.t("settings.shortcuts.edit")}
                </Button>
              </div>
            </SettingItem>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetAll}
          className="gap-2"
        >
          <RotateCcw className="size-4" />
          {i18n.t("settings.shortcuts.reset")}
        </Button>
      </div>

      {/* 快捷键编辑对话框 */}
      <Dialog open={isRecording} onOpenChange={setIsRecording}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{i18n.t("settings.shortcuts.editDialogTitle")}</DialogTitle>
            <DialogDescription>
              {currentShortcut
                ? i18n.t("settings.shortcuts.editDialogDesc", [SHORTCUT_DEFINITIONS[currentShortcut.id as keyof typeof SHORTCUT_DEFINITIONS]?.name()])
                : i18n.t("settings.shortcuts.editDialogTitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {i18n.t("settings.shortcuts.editDialogDesc")}
              </label>
              <Input
                autoFocus
                onKeyDown={handleKeyDown}
                value={formatKeyCombo(recordingKeys)}
                readOnly
                placeholder={i18n.t("settings.shortcuts.editDialogPlaceholder")}
                className="text-center font-mono text-lg h-12"
              />
            </div>

            {recordingKeys.length > 0 && (
              <div className="flex justify-center">
                <KbdGroup>
                  {normalizeKeyCombo(recordingKeys).map((key, i) => (
                    <Kbd key={i}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </div>
            )}

            <Alert>
              <AlertDescription className="text-xs">
                {i18n.t("settings.shortcuts.editDialogHint")}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              {i18n.t("settings.shortcuts.editDialogCancel")}
            </Button>
            <Button
              onClick={handleSaveShortcut}
              disabled={recordingKeys.length === 0}
            >
              {i18n.t("settings.shortcuts.editDialogSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
