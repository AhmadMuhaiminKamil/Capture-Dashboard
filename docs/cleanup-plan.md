# Cleanup Data Plan

## Scope
Cleanup runs only after a valid manual backup ZIP has completed in the same browser session.

## Included in backup
- `database/backup_<date>.xlsx`, one sheet each for `binding_tickets`, `gno_tickets`, `ognok_tickets`, and `routing_tickets`.
- `images/`, all objects from `CaptureBinding_Images`.

## Cleanup scope
Delete all rows from every public application table and all objects in the image bucket:
1. `binding_tickets`
2. `gno_tickets`
3. `ognok_tickets`
4. `routing_tickets`
5. `binding_submit_log`
6. `capture_ticket_messages`
7. `pending_photo_buffer`
8. `photo_batch_buffer`
9. All objects in `CaptureBinding_Images`.

## Operational requirement
Pause the bot before cleanup and resume it only after cleanup completes.

## Required safeguards
1. Cleanup button remains disabled until `backupAll()` completes successfully in the current session.
2. Show dry-run counts for every table and total bucket files before confirmation.
3. User types exact text `HAPUS SEMUA` in a destructive confirmation modal.
4. Cleanup API uses a server-side service-role route; no service-role credential reaches the browser.
5. Delete table rows and bucket objects in named steps, showing success/failure per step.
6. Never run cleanup automatically based on storage thresholds.
7. Refresh storage statistics and verify expected row/file counts after completion.

## Test plan
Use a separate Supabase staging project:
1. Seed each cleanup table with test rows and bucket with test images.
2. Run backup; open ZIP; verify four Excel sheets and all images.
3. Confirm cleanup button is disabled before backup.
4. Confirm wrong phrase cannot submit.
5. Confirm exact phrase deletes only the five included tables plus bucket files.
6. Confirm excluded buffer and message tables retain their rows.
7. Simulate one API failure; verify UI reports failed step and does not claim complete cleanup.

## Production rollout
Implement and test only after staging test passes. Production cleanup is a separate explicit request and confirmation.
