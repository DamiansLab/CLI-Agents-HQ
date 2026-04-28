# Changelog

All notable changes to the **CLI Agents HQ** project will be documented in this file.

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
