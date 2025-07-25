import React, { useState, useEffect } from 'react'
import type { ModalProps } from '@mantine/core'
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Group,
  Button,
  Textarea,
  Notification,
} from '@mantine/core'
import { CodeHighlight } from '@mantine/code-highlight'
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react'

import useFile from '../../../store/useFile'
import useGraph from '../../editor/views/GraphView/stores/useGraph'

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const selected = useGraph(s => s.selectedNode)

  const setContents = useFile(s => s.setContents)
  const setGraph = useGraph(s => s.setGraph)
  const contents = useFile(s => s.contents)

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const path = selected?.path || ''
  const display = JSON.stringify(
    Array.isArray(selected?.text)
      ? Object.fromEntries(selected!.text)
      : selected?.text,
    (_k, v) => (typeof v === 'string' ? v.replaceAll('"', '') : v),
    2
  )

  useEffect(() => {
    setError(null)
    setIsEditing(false)
    setDraft(display)
  }, [display, opened])

  const handleSave = () => {
    try {
      const parsedNode = JSON.parse(draft)

      const rootObj = JSON.parse(contents)

      const parts = path.replace(/^\{Root\}\.?/, '').split('.')
      let cur: any = rootObj
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in cur)) throw new Error(`Invalid path: ${path}`)
        cur = cur[parts[i]]
      }
      cur[parts[parts.length - 1]] = parsedNode

      const newJsonStr = JSON.stringify(rootObj, null, 2)

      setContents({ contents: newJsonStr, skipUpdate: true })

      setGraph(newJsonStr)

      onClose()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="auto"
      title={
        <Group position="apart" noWrap>
          <Text weight={500}>Node Content</Text>

          {isEditing ? (
            <Group spacing="xs">
              <Button size="xs" leftIcon={<IconCheck size={14} />} onClick={handleSave}>
                Save
              </Button>
              <Button
                size="xs"
                variant="outline"
                leftIcon={<IconX size={14} />}
                onClick={() => {
                  setIsEditing(false)
                  setError(null)
                  setDraft(display)
                }}
              >
                Cancel
              </Button>
            </Group>
          ) : (
            <Button
              size="xs"
              variant="outline"
              leftIcon={<IconEdit size={14} />}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </Group>
      }
    >
      <Stack py="sm" gap="sm">
        {error && (
          <Notification color="red" onClose={() => setError(null)}>
            {error.startsWith('Unexpected') ? 'JSON parse error' : error}
          </Notification>
        )}

        {/* CONTENT */}
        <Stack gap="xs">
          <Text fz="xs" fw={500}>
            Content
          </Text>
          {isEditing ? (
            <Textarea
              minRows={8}
              value={draft}
              onChange={e => setDraft(e.currentTarget.value)}
              styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
            />
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight code={display} miw={350} maw={600} language="json" withCopyButton />
            </ScrollArea.Autosize>
          )}
        </Stack>

        {/* JSON PATH */}
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize mah={100} maw={600}>
          <CodeHighlight code={path} miw={350} maw={600} language="text" withCopyButton />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  )
}
