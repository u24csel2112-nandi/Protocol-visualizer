# Assignment 2 Reflection

## AI Platform and Model Chosen
For this assignment, I utilized **Google Antigravity** running the **Gemini 3.1 Pro (High)** model. I chose this platform because of its strong capabilities in generating structured simulations and managing multi-file web applications efficiently, as well as its ability to directly manipulate the file system to rapidly prototype and iterate on the code.

## Synchronization of Application-Layer and Transport-Layer Views
To ensure the Application-layer and Transport-layer views remained perfectly synchronized, I refactored the simulation timeline into a single data structure (`sequences` in `script.js`). Instead of keeping two disparate lists of events, each element in the sequence array represents a logical step in time and contains both an `app` sub-object and a `transport` sub-object (either of which can be `null`).

When the simulation progresses (either via autoplay or manual "Next"/"Previous" controls), the `renderStep(index)` function simultaneously updates both `visAreaApp` and `visAreaTransport` DOM elements. CSS `display` toggling handles which view is currently visible to the user without interrupting the underlying parallel DOM updates.

## Correcting TCP Logic and State Transitions
During the development, the AI initially tended to gloss over sequence and acknowledgement number incrementation for data payloads (often keeping ACK numbers static or incrementing them by 1 regardless of payload size). 
To ensure correctness:
*   I guided the AI to specify exact payload lengths (e.g., 75 bytes for an HTTP GET request).
*   I ensured the subsequent ACK from the server properly reflected `Ack = Previous Seq + Payload Length`.
*   I verified that the 3-way handshake correctly incremented sequence numbers by 1 (SYN consumes 1 sequence number), and similarly for FIN segments during connection teardown.

## Key Differences Observed Between Flows
*   **Browsing (HTTP):** Characterized by a short request-response cycle. Following the 3-way handshake, there is an immediate `PSH, ACK` segment containing the HTTP GET request, followed by the HTTP 200 OK response. The connection is quickly torn down using the 4-way FIN/ACK termination.
*   **Mail (SMTP):** This represents a much longer conversational stream. The TCP stream remains open while the client and server exchange multiple application-layer messages (`EHLO`, `MAIL FROM`, `RCPT TO`, `DATA`, `QUIT`). Each command triggers its own PSH/ACK transport segments, demonstrating how a single TCP connection can reliably multiplex multiple back-and-forth application interactions.
*   **Streaming:** Distinguished by multiple, larger segment transfers. After the initial manifest request (`playlist.m3u8`), fetching media segments (`segment_001.ts`) results in larger chunks of data being sent by the server. At the transport layer, this translates to multiple TCP segments (e.g., Data Segment 1/3, 2/3, 3/3) to deliver a single large application-layer payload, effectively demonstrating windowing and fragmentation.
