# Script API Reference

The `Narratium` global object provides access to the script runner API.

## Variables API
Manage persistent variables scoped to the character or session.

### `Narratium.variables.get(key: string): any`
Retrieves a variable value.
```javascript
const hasMet = Narratium.variables.get('met_hero');
```

### `Narratium.variables.set(key: string, value: any): void`
Sets a variable value. This is persisted automatically.
```javascript
Narratium.variables.set('met_hero', true);
```

### `Narratium.variables.delete(key: string): void`
Deletes a variable.
```javascript
Narratium.variables.delete('met_hero');
```

### `Narratium.variables.list(): string[]`
Returns a list of all variable keys.

## Events API
Listen to and emit events.

### `Narratium.events.on(event: string, handler: (data: any) => void): void`
Subscribes to an event.
```javascript
Narratium.events.on('message:received', (msg) => {
  console.log('New message:', msg.content);
});
```

### `Narratium.events.once(event: string, handler: (data: any) => void): void`
Subscribes to an event once.

### `Narratium.events.emit(event: string, data: any): void`
Emits a custom event.
```javascript
Narratium.events.emit('minigame:score', { score: 100 });
```

## World Book API
Access world lore and entries.

### `Narratium.worldbook.get(id: string): Promise<WorldBookEntry | null>`
Fetches a specific world book entry by ID or key.
```javascript
const entry = await Narratium.worldbook.get('city_gate');
```

### `Narratium.worldbook.search(query: string): Promise<WorldBookEntry[]>`
Searches for entries matching a query.
```javascript
const entries = await Narratium.worldbook.search('magic');
```

## Utilities

### `Narratium.utils.log(...args: any[]): void`
Logs messages to the console and the parent window's debug log.

### `Narratium.utils.waitFor(ms: number): Promise<void>`
Pauses execution for a specified duration.
```javascript
await Narratium.utils.waitFor(1000);
```
