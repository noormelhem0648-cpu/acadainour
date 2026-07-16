// Shared SSE reader — eliminates 4 copies of the same while-loop.
// Usage: const text = await readSSEStream(response.body.getReader(), chunk => setState(s => s + chunk))
export async function readSSEStream(reader, onChunk) {
  const decoder = new TextDecoder()
  let buffer = '', full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const chunk = line.slice(6)
      if (chunk === '[DONE]') return full
      full += chunk
      onChunk?.(chunk, full)
    }
  }
  return full
}
