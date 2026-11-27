import { useMemo, useState } from 'react'
import { EMOJI_GROUPS } from '../lib/emojiData'

interface Props {
  onPick: (emoji: string) => void
}

// One emoji: a pictograph with optional variation selector / skin tone, joined by ZWJ.
const EMOJI_RE = /\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})*(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})*)*/gu

const GROUPS = EMOJI_GROUPS.map((g) => ({
  name: g.name,
  items: g.items.map((line) => {
    const [emoji, ...words] = line.split(' ')
    return { emoji, words: words.join(' ') }
  }),
}))

/** Searchable emoji grid. Typing (or pasting from the Mac emoji viewer) an emoji also offers it as a sticker. */
export function EmojiPicker({ onPick }: Props) {
  const [query, setQuery] = useState('')

  const { typed, groups } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const typed = [...new Set(query.match(EMOJI_RE) ?? [])]
    const words = q.replace(EMOJI_RE, ' ').split(/\s+/).filter(Boolean)
    const groups = words.length
      ? [
          {
            name: 'Results',
            items: GROUPS.flatMap((g) => g.items).filter((it) => words.every((w) => it.words.includes(w))),
          },
        ]
      : typed.length
        ? []
        : GROUPS
    return { typed, groups }
  }, [query])

  const empty = !typed.length && groups.every((g) => !g.items.length)

  return (
    <div className="emoji-picker">
      <input
        type="search"
        className="emoji-search"
        value={query}
        placeholder="Search emoji, or type one (ctrl + ⌘ + space)"
        aria-label="Search emoji"
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="emoji-scroll">
        {typed.length > 0 && (
          <EmojiGrid title="Typed" emojis={typed} onPick={onPick} />
        )}
        {groups.map((g) =>
          g.items.length ? (
            <EmojiGrid key={g.name} title={g.name} emojis={g.items.map((i) => i.emoji)} onPick={onPick} />
          ) : null,
        )}
        {empty && <p className="hint">No emoji found.</p>}
      </div>
    </div>
  )
}

function EmojiGrid({ title, emojis, onPick }: { title: string; emojis: string[]; onPick: (e: string) => void }) {
  return (
    <>
      <h3 className="field-label">{title}</h3>
      <div className="emoji-grid" role="group" aria-label={title}>
        {emojis.map((emoji) => (
          <button key={emoji} type="button" className="emoji-btn" aria-label={emoji} onClick={() => onPick(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
