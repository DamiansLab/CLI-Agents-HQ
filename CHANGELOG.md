# Changelog

All notable changes to the **CLI Agents HQ** project will be documented in this file.

## [1.8.0] - 2026-05-04
### Added
- **Reliability Overhaul:**
  - **Fail-Fast Security:** Server now requires `JWT_SECRET` and `CLI_AGENTS_SECRET_KEY` env vars to start, preventing insecure default deployments.
  - **Session Persistence:** Full chat history is now persisted in `data.json`, allowing recovery from worker or client disconnects.
  - **Multi-Worker Routing:** New `agentToWorker` mapping allows multiple local machines to connect to a single HQ simultaneously.
  - **Stall Detection:** 60-second heartbeat monitor alerts the UI if an AI process hangs.
  - **Knowledge Vault Search:** Added a server-side search API to filter snippets by title or content.
- **Robust Skill Sync:** Migrated from timestamp-only sync to **MD5 Content Hashing**, eliminating redundant writes and sync race conditions.
- **Terminal Overhaul:**
  - Improved interactive prompt detection with specialized regex.
  - New `awaiting-input` agent status for better visual feedback in the dashboard.
- **Engineering Standards:**
  - **Test Suite:** Established a formal `tests/` directory with `npm test` integration (6 core suites).
  - **Modular Architecture:** Refactored the monolithic `server.js` into clean components in `lib/` (`stateManager`, `userManager`).

## [1.7.0] - 2026-04-28
### Added
- **Automated Skill Sync:** Implemented bi-directional synchronization for the `skills/` folder. The system uses "Last Modified" timestamps to ensure the newest version of an agent's knowledge is always used, whether it's on the server or a local machine.
- **Windows UTF-8 Support:** Added automatic execution of `chcp 65001` on agent startup. This fixes encoding issues for non-English locales (e.g., Greek CP 737) and improves text streaming performance.
- **Visual Reflection Feedback:**
  - New system logs entries with brain icons (🧠) and learned snippets.
  - Interactive button states in the Dashboard ("LEARNING...", "SUCCESS!").
- **Persistence Protection:** Added `users.json` to the automated deployment script to ensure user accounts are preserved during migrations.

### Changed
- **Refinement:** Removed disruptive browser `alert()` boxes during agent reflection.
- **Sync Logic:** Server now appends "Lessons Learned" to its local files immediately upon worker success.

## [1.6.0] - 2026-04-20
### Added
- **Conference Room 2.0:** Multi-agent collaboration with shared history.
- **Global Project Brief:** Centralized instructions sent to all agents.
- **Gamification:** Level-up visuals and Senior Status (Level 3+) styling.
- **Env Support:** Configuration via `.env` files.

### Fixed
- **Learning Logic:** Fixed file appending issues in the local agent.
- **UI:** Corrected notification badge clearing behavior.

## [1.5.0] - 2026-04-10
### Added
- **Hybrid Mode:** Secure separation of cloud dashboard and local execution.
- **User Management:** JWT authentication and admin controls.
- **Knowledge Vault:** Snippet sharing with agents.

---
*End of Changelog*
