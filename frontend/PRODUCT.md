# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React and TypeScript with Vite in `/frontend`, calling the existing Node, Express, and TypeScript API in `/backend`. The immediate target is a locally runnable prototype. No hosting target has been chosen.

## Users

Personal assistants manage email conversations for one or more clients. They need to find work that needs attention, see who should reply, review a thread, correct an assignment, and mark work done. Clients are a secondary audience and should eventually see only conversations that require their personal response.

## Product Purpose

Help assistants triage and complete client email work with a clear, editable record of reply responsibility. Build the assistant path first, then the client view.

## Operating Context

Assistants work across client email accounts and conversation lists. They filter or search conversations, inspect message threads and summaries, assign reply responsibility, and update status. Clients have a restricted view of their open conversations assigned to them.

## Capabilities and Constraints

- Reply responsibility has four states: assistant, client, no reply, and needs review. Assistants can override an assignment.
- The existing API supports assistant and client accounts, Gmail and Outlook demo account records, conversation search and segments, conversation detail, and assistant updates to responsibility, status, importance, and unread state.
- Gmail and Outlook connections, synchronization, and AI results are simulated in this prototype. Live integrations are a future goal, not a current capability.
- The app must work on mobile and be keyboard accessible.
- No hosting target has been chosen.

## Brand Commitments

“Relay” is a provisional name and may change. The design agent should choose the visual direction from this product brief; the user has no fixed palette or screenshot reference.

## Evidence on Hand

- The existing API and demo data are in `/backend`; its README documents endpoints and prototype limits.
- There are no confirmed testimonials, customers, benchmarks, or live integration claims to use in the interface.

## Product Principles

1. Make the next action and its owner easy to find.
2. Keep responsibility visible and correctable by the assistant.
3. Show enough conversation context to support a decision without hiding the full thread.
4. Be candid about simulated accounts and results.
5. Keep assistant and client access aligned with their distinct roles.

## Accessibility & Inclusion

Support keyboard operation and mobile use.
