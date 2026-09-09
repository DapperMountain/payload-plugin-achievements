import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/**
 * Minimal Lexical editor state for a single paragraph of plain text.
 * Used by seed + beforeValidate coercion when hosts still pass strings.
 */
export function plainTextToLexical(text: string): SerializedEditorState {
  const trimmed = text.trim()
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: trimmed
            ? [
                {
                  type: 'text',
                  text: trimmed,
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                },
              ]
            : [],
        },
      ],
    },
  } as unknown as SerializedEditorState
}
