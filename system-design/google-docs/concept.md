# Google Docs

[Link to Google Docs System Design](https://www.greatfrontend.com/questions/system-design/collaborative-editor-google-docs#requirements-exploration)

## Realtime Collaboration Docs

### Functional Requirements

- Any participant can edit / view the document
- Updates by peers on the same document are reflected automatically
- Conflicts are resolved if participants are editing the same part
- All participants should see the same document revision eventually
- Offline usage? Not required, but we’ll discuss if there's time

### Non -functional requirements

- Updates by others are reflected in real-time
- Support up to 100 concurrent editors

### Background

- Responsive
- Real time Updates
- Conflict prone
- Distributed
- Ad Hoc
- Unpredictable

- Groupware systems

- Communication latency -> limits communication speed, leading to fundamental challenge. -> Users expect their own edits to be incorporated into the document immediately. Yet, if these edits are applied instantly, they are necessarily inserted into different revisions of the document due to the delay in communication.

Example:

Alice -> Mary -> My
Bob -> Mary -> Hary

the challenge of real-time collaborative editing is to determine how to correctly apply edits from remote users that were originally made in versions of the document that never existed locally and may conflict with the user's own local changes.

## Approach

### Rendering and editing Rich Text

(Has been Deep dived in its own section -> Rich Text Editor design)

- Ways to build Rich Text Editor on the Web
  - DOM with augmented fake cursors
  - contenteditable
  - HTML canvas element

- Production systems may combine these capabilities

- Google in 2021 announced to use Canvas based approach

### Request payload contents

when a participant makes an update, or receives an update from some other participants, what should the request payload contain

Two approaches - Payload contains the entire current document - Clear document state: Recipients know the full state of the document the sender was viewing when it was updated. - - Payload contains only changes (the delta)
