

---

### A Practical Guide to Structuring Effector Models

This guide synthesizes Effector's core API with a structured, maintainable approach to building models, based on best practices. The primary goal is **top-down readability**: a developer should be able to understand a feature's logic by reading the file from top to bottom, moving from high-level definitions to low-level details.

#### The 6-Block Model Structure

Every logic module (`model`) should be organized into six distinct blocks, in this specific order, separated by blank lines.
All effector logic is in separate file, so export all events and required stores (e.g. `$isLoading`) from the model file, not effects or logic.
---

#### 1. Types & Constants

Define all TypeScript types and module-specific constants at the very top. This section acts as a quick reference for the data structures the module operates on.

```ts
// --- Types & Constants ---
type User = { id: number; name: string };
type Status = 'pending' | 'done' | 'fail';

const GUEST_ID = -1;
```

---

#### 2. Events

Declare all events here. This block is the **public interface** of your model. Events are facts that describe "what happened" in the application, without any implementation logic.

*   **`createEvent<Payload>()`**: The primary method to create a callable event.
*   **Naming:** Use past-tense `camelCase` (e.g., `formSubmitted`, `userNameUpdated`).
*   **Key Methods:**
    *   `event.map(fn)`: Creates a new, *derived* event that triggers after the original, with a transformed payload.
    *   `event.prepend(fn)`: Creates a new, *callable* event that transforms its payload *before* passing it to the original event. Useful for creating specific "pre-handlers".
    *   `event.filter({ fn })`: Creates a new, *derived* event that triggers only if `fn` returns `true`.

```ts
// --- Events ---
export const pageMounted = createEvent<void>();
export const userClicked = createEvent<User>();

// A derived event for when an admin clicks
export const adminClicked = userClicked.filter({
  fn: (user) => user.isAdmin,
});
```

---

#### 3. Effects

Declare all effects (asynchronous operations and side effects) in this block. This groups all interactions with the outside world (e.g., API requests).

*   **`createEffect<Params, Done, Fail>(handler?)`**: Creates an effect.
*   **Naming:** Use a verb-noun pattern with an `Fx` suffix (e.g., `fetchUserFx`, `saveFormFx`).
*   **Best Practice:** Declare effects here without their implementation. The handler logic (`.use()`) should be defined in the "Implementation Details" section at the bottom of the file.
*   **Key Properties:**
    *   `.pending`: A boolean store, `true` when the effect is in-flight.
    *   `.doneData`: An event that triggers with the successful result.
    *   `.failData`: An event that triggers with the error on failure.

```ts
// --- Effects ---
export const fetchUserFx = createEffect<number, User, Error>();
export const saveUserFx = createEffect<User, void, Error>();
```

---

#### 4. Stores & Derived Stores

Define all state holders. Base stores come first, followed by derived stores.

*   **`createStore<State>(initialState)`**: Creates a writable store.
*   **Naming:**
    *   Use a `$` prefix for all stores (e.g., `$user`, `$users`).
    *   For boolean stores, use prefixes like `is`, `has`, or `was` (e.g., `$isLoading`, `$isFormValid`).
*   **Key Methods:**
    *   `$store.on(trigger, reducer)`: The primary way to update a store's state. The reducer `(state, payload) => newState` computes the new value.
    *   `$store.map(fn)`: Creates a new *derived* (read-only) store from the original.
    *   `$store.reset(trigger)`: Resets the store to its initial state when the trigger fires.

```ts
// --- Stores ---
const $user = createStore<User | null>(null);
const $users = createStore<User[]>([]);
const $error = createStore('');

// Derived stores
export const $isLoading = fetchUserFx.pending;
export const $isFormValid = combine(
  $user, $users,
  (user, users) => user !== null && users.length > 0
);
```
We should never use `.on` method on stores, as it can lead to unexpected behavior. Instead, use `sample` to connect events and effects to stores.
---

#### 5. Logic (Connections)

This is the core of the model, where the previously defined units are wired together. This section should read as a series of declarative rules.

*   **`sample({ clock, source, filter, fn, target })`**: The primary operator for connecting units. It reads from a `source` when `clock` triggers, processes the data, and sends it to a `target`.
*   **`combine(stores, fn?)`**: Creates a single derived store from multiple source stores.
*   **`attach({ effect, source?, mapParams? })`**: Creates a specialized effect that automatically sources data from stores.
*   **`split({ source, match, cases })`**: Routes data from a `source` to different `cases` based on conditions defined in `match`.
*   **`merge(units)`**: Creates a single event that fires when any of the given units fire.

```ts
// --- Logic ---

// When page mounts, fetch the user
sample({
  clock: pageMounted,
  fn: () => 1, // Let's fetch user with ID 1
  target: fetchUserFx,
});

// Update the user store on successful fetch
$user.on(fetchUserFx.doneData, (_, user) => user);

// Reset error on new fetch attempt
$error.reset(fetchUserFx);
// Store error message on failure
$error.on(fetchUserFx.failData, (_, error) => error.message);

// When the save button is clicked, take the current user data and save it
sample({
  clock: saveButtonClicked,
  source: $user,
  filter: Boolean, // Only run if $user is not null
  target: saveUserFx,
});
```

---

#### 6. Implementation Details

This final block contains all the "how" — the low-level helper functions and effect handlers. By placing this at the bottom, anyone reading the file first understands the high-level logic before diving into the details.

*   Use `function` declarations for helpers so they can be referenced in the logic block above (thanks to hoisting).
*   Use `effect.use(handler)` to define the implementation for effects declared earlier.

```ts
// --- Implementation ---
fetchUserFx.use(async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Network request failed');
  return response.json();
});

saveUserFx.use(async (user) => {
  await api.save(user);
});

function isEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}
```