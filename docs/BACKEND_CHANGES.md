# Small backend changes the frontend asks for

None of these block Stage 0 or Stage 1. They are small.

## 1. `firstTryCorrect` on resume (so the collection row survives a refresh)
File: `server/src/mappers/attemptMappers.js`, inside `toQuestionForPlay`, in the `withState` block:

```js
if (withState) {
  out.resolved = Boolean(attemptQuestion.resolved);
  out.wrongChoiceKeys = [...(attemptQuestion.wrongChoiceKeys ?? [])];
  out.firstTryCorrect = Boolean(attemptQuestion.firstTryCorrect); // add this line
}
```
Only the resume route sends this. It leaks nothing (the player already knows if they got it right).

## 2. `trust proxy` before deploying behind a host (Render, Railway, ...)
File: `server/src/app.js`, in `createApp`, right after `const app = express();`:

```js
app.set('trust proxy', 1);
```
Without it every visitor shares one IP and hits the 100 requests/minute limit together.

## 3. Environment
`server/.env`: `CLIENT_ORIGIN=http://localhost:3000` (Next dev server). For production, set it to the real site URL.
